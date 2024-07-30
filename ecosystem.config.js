module.exports = {
    apps: [
        {
            name: "RSecktor",
            script: "./lib/client.js",
            node_args: "--max-old-space-size=7680",
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: "YYYY-MM-DD HH:mm:ss"
        }
    ]
}