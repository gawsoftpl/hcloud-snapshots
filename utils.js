const convertServerLabels = (labels) => {
    return Object.entries(labels).reduce((out, [key, value]) => {
        out[`server_${key}`] = value
        return out
    }, {})
}

const decodeServerLabels = (labels) => {
    return Object.entries(labels).reduce((out, [key, value]) => {
        if (key.startsWith('server_')) {
            out[key.replace('server_','')] = value
        }
        return out
    }, {})
}

module.exports = {
    decodeServerLabels,
    convertServerLabels
}