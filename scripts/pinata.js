import { PinataSDK } from "pinata";
import dotenv from "dotenv"
dotenv.config()

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.GATEWAY_URL
})

async function StoreAvatar(testJson) {
    try {
        const upload = await pinata.upload.public.json(testJson);
        return upload.cid;
    } catch (error) {
        console.log(error)
    }
}

export default {
    StoreAvatar
}