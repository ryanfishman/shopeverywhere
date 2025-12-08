import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const generateObjectKey = (prefix: string, filename: string) => {
  const ext = filename.split(".").pop() || "bin";
  const unique = crypto.randomBytes(8).toString("hex");
  return `${prefix}/${unique}.${ext}`;
};

export const generateStoreImageKey = (filename: string) => {
  const ext = filename.split(".").pop() || "bin";
  const guid = crypto.randomUUID();
  return `storeimg-${guid}.${ext}`;
};

export const generateProductImageKey = (filename: string) => {
  const ext = filename.split(".").pop() || "bin";
  const guid = crypto.randomUUID();
  return `productimg-${guid}.${ext}`;
};

const getS3Client = () => {
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const region = process.env.DO_SPACES_REGION || "nyc3";
  const accessKeyId = process.env.DO_SPACES_ACCESS_KEY;
  const secretAccessKey = process.env.DO_SPACES_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("DigitalOcean Spaces configuration missing");
  }

  return new S3Client({
    endpoint: `https://${endpoint}`,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });
};

export const uploadToSpaces = async (key: string, file: Blob | File) => {
  const bucket = process.env.DO_SPACES_BUCKET;
  const endpoint = process.env.DO_SPACES_ENDPOINT;

  if (!bucket || !endpoint) {
    throw new Error("DigitalOcean Spaces bucket or endpoint missing");
  }

  const s3 = getS3Client();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const contentType = file instanceof File ? file.type : "application/octet-stream";

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  const url = `https://${bucket}.${endpoint}/${key}`;
  return { url, key };
};





