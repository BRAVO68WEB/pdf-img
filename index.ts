process.getBuiltinModule = require;

import { Hono } from "hono";
import { pdfToPng } from "pdf-to-png-converter"

import { createHash } from "node:crypto";

import { ObjectCannedACL, S3Client, type S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

/**
 * Uploader class to upload files to S3
 */
export class Uploader {
	private static _s3Client: S3Client;
	private static _s3Opts: { bucket: string };

	/**
	 * Constructor to initialize the S3 client
	 * @param bucket S3 bucket name
	 */
	constructor(bucket: string) {
		const options = {
			bucket,
		};
		Uploader._s3Opts = options;
		const s3ClientOpts: S3ClientConfig = {
            endpoint: process.env.R2_ENDPOINT,
			region: "apac",
			credentials: {
				accessKeyId: process.env.R2_ACCESS_KEY_ID!,
				secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
			},
		};
		const client = new S3Client(s3ClientOpts);
		Uploader._s3Client = client;
	}

	/**
	 * Upload file to S3
	 * @param entity File entity path to be uploaded
	 * @param id name of the file
	 * @param file File to be uploaded
	 * @param acl `public-read` or `private` access
	 */
	async uploadFile(entity: string, id: string, file: Blob | Buffer, acl: ObjectCannedACL) {
		const parallelUploads3 = new Upload({
			client: Uploader._s3Client,
			params: {
				Bucket: Uploader._s3Opts.bucket,
				ACL: acl,
				Body: file,
				Key: entity + '/' + id,
			},
		});

		await parallelUploads3.done();
	}
}

const app = new Hono()

app.get("/", (c) => c.text("Hello Hono!"));

app.post("/", async (c)=> {
    const { pdf_url } = await c.req.json();
    
    if (!pdf_url) {
        return c.json({ error: "No PDF URL provided" }, 400);
    }

    // hash pdf_url to get a unique id
    const pdf_url_hash = createHash("sha1")
        .update(pdf_url)
        .digest("hex");

    const pdf_url_hash_dir = pdf_url_hash.slice(0, 2);

    const pdf_arrayBufer = await fetch(pdf_url).then((res) => res.arrayBuffer());

    const pdf = await pdfToPng(pdf_arrayBufer, {
        disableFontFace: false,
        useSystemFonts: false,
        enableXfa: false,
        viewportScale: 2.0,
        strictPagesToProcess: false,
    });

    const imgArr: string[] = []
    const upload = new Uploader(process.env.R2_BUCKET_NAME!);

    const parse = pdf.map(async (page) => {
        const arrBuf = page.content

        await upload.uploadFile("pdf-images/" +pdf_url_hash_dir, pdf_url_hash + '_' + page.pageNumber + '.png', arrBuf, 'public-read');
        
        imgArr.push(`${process.env.R2_PUBLIC_URL}/pdf-images/${pdf_url_hash_dir}/${pdf_url_hash}_${page.pageNumber}.png`);
    })

    await Promise.all(parse);

    return c.json({ png_urls: imgArr });
})
export default {
    port: 5000,
    fetch: app.fetch,
};