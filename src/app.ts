import {
    ListBucketsCommand,
    ListObjectsV2Command,
    PutObjectCommand,
    PutObjectCommandInput,
    S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';
import md5 from 'md5';
import path from 'path';
import mime from 'mime-types'; // Thư viện để xác định MIME type dựa trên phần mở rộng của file

import {
    cloudflareAccountId,
    cloudflareR2AccessKeyId,
    cloudflareR2SecretAccessKey,
    cloudflareR2BucketName
} from './config.js';

const S3 = new S3Client({
    region: 'apac',
    endpoint: `https://${cloudflareAccountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: cloudflareR2AccessKeyId,
        secretAccessKey: cloudflareR2SecretAccessKey,
    },
});

const getFileList = (dirName) => {
    let files = [];
    const items = fs.readdirSync(dirName, { withFileTypes: true });

    for (const item of items) {
        if (item.isDirectory()) {
            files = [...files, ...getFileList(`${dirName}/${item.name}`)];
        } else {
            files.push(`${dirName}/${item.name}`);
        }
    }

    return files;
};

const files = getFileList('uploads');
const logFile = 'upload_errors.log';

const logError = (message: string) => {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
};

const uploadFile = async (file) => {
    const fileStream = fs.readFileSync(file);
    let fileSize = fs.statSync(file).size;
    const relativeFilePath = file.replace(/^uploads\//, ''); // Loại bỏ tiền tố "uploads/"

    if(relativeFilePath.includes('.gitkeep')) {
        return
    }

    if(fileSize === 0) {
        logError(`File size == 0 with file: ${relativeFilePath}`);
        return
    }

    console.info(`Uploading: ${relativeFilePath}`);

    let mimeType = mime.lookup(relativeFilePath) || '';
    console.info(`ContentType: ${mimeType}`)

    console.info(`Image Size: ${fileSize}`)

    const uploadParams = {
        Bucket: cloudflareR2BucketName,
        Key: `uploads/${relativeFilePath}`, // Giữ nguyên cấu trúc thư mục
        Body: fileStream,
        ContentLength: fileSize,
        // ContentType: mimeType // Đặt ContentType phù hợp
        ContentType: mimeType // Đặt ContentType phù hợp
    };

    const cmd = new PutObjectCommand(uploadParams);

    const digest = md5(fileStream);

    cmd.middlewareStack.add((next) => async (args: any) => {
        args.request.headers['if-none-match'] = `"${digest}"`;
        return await next(args);
    }, {
        step: 'build',
        name: 'addETag'
    })

    try {
        const data = await S3.send(cmd);
        console.log(`Success - ${relativeFilePath}: Status Code: ${data.$metadata.httpStatusCode}`);
    } catch (err) {
        if (err.hasOwnProperty('$metadata')) {
            if (err.$metadata.httpStatusCode === 412) {
                console.warn(`Warning - ${relativeFilePath}: ETag precondition failed, retrying without If-None-Match...`);
                console.info(`ContentType After Retry: ${mimeType}`)
                console.info(`Image Size After Retry: ${fileSize}`)
                // Remove the If-None-Match header and retry without it
                const uploadParamsWithoutETag = {
                    ...uploadParams,
                    Key: `uploads/${relativeFilePath}`, // Giữ nguyên cấu trúc thư mục
                    Body: fileStream,
                    ContentLength: fileSize,
                    ContentType: mimeType
                };

                try {
                    const retryCmd = new PutObjectCommand(uploadParamsWithoutETag);
                    const retryData = await S3.send(retryCmd);
                    console.log(`Success after retry - ${relativeFilePath}: Status Code: ${retryData.$metadata.httpStatusCode}`);
                } catch (retryErr) {
                    console.error(`Final Fail - ${relativeFilePath}: Status Code: ${retryErr.$metadata.httpStatusCode} - ${retryErr.message}`);
                    logError(`Final Fail - ${relativeFilePath}: Status Code: ${retryErr.$metadata.httpStatusCode} - ${retryErr.message}`);
                }
            } else {
                const errorMessage = `Fail - ${relativeFilePath}: Status Code: ${err.$metadata.httpStatusCode} - ${err.message}`;
                console.error(errorMessage);
                logError(errorMessage);
            }
        } else {
            const errorMessage = `Fail - ${relativeFilePath}: Error: ${err.message}`;
            console.error(errorMessage);
            logError(errorMessage);
        }
    }
};

const startUploads = async () => {
    const uploadPromises = files.map(file => uploadFile(file)); // Chạy các tác vụ tải lên song song
    try {
        await Promise.all(uploadPromises); // Chờ tất cả các tác vụ hoàn tất
        console.log('All uploads completed');
    } catch (err) {
        console.error('Error during uploads', err);
    }
}

startUploads().catch(err => console.error('Error', err));