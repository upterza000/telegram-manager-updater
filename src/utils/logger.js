class Logger {
    static log(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        
        console.log(JSON.stringify(logEntry));
    }
    
    static info(message, meta) {
        this.log('info', message, meta);
    }
    
    static error(message, meta) {
        this.log('error', message, meta);
    }
    
    static warn(message, meta) {
        this.log('warn', message, meta);
    }
    
    static debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            this.log('debug', message, meta);
        }
    }
}

module.exports = Logger;