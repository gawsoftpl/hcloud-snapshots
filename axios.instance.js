// Create a new Axios instance
const axios = require("axios");


const token = process.env.HCLOUD_TOKEN

if (!token) {
    console.error("No set env HCLOUD_TOKEN")
    process.exit(1)
}

const axiosInstance = axios.create({
    baseURL: 'https://api.hetzner.cloud/v1',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

module.exports = {
    axiosInstance
}