import {AwsV4Signer} from './awsv4';
import {URL} from 'whatwg-url';

global.URL = URL;

/**
 * An example edge function which forwards the request to the origin.
 * See routes.js for how this function is configured to run for requests to "/".
 */

export async function handleHttpRequest(request, context) {
    const s3Url = new URL(request.path, 'https://edgio-test-v4-123235ews.s3.us-east-1.amazonaws.com/');

    const signer = new AwsV4Signer({
        url: s3Url.href,
        method: request.method,
        region: 'us-east-1',
        service: 's3',
        accessKeyId: context.environmentVars.S3_ACCESS_KEY_ID,
        secretAccessKey: context.environmentVars.S3_SECRET_ACCESS_KEY,
        signQuery: true,
    })

    const signedDetails = await signer.sign();

    return fetch(signedDetails.url, {
        method: signedDetails.method,
        headers: signedDetails.headers,
        edgio: {
            origin: 's3',
        }
    })
}
