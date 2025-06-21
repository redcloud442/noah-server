import { fetch } from "undici";
export class RedisAPI {
    baseURL;
    password;
    constructor(baseURL, password) {
        this.baseURL = baseURL;
        this.password = password;
    }
    // 🔹 Private helper for headers
    getHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.password}`,
        };
    }
    // 🔹 Authenticate Redis
    async authenticate() {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/auth`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const data = (await response.json().catch(() => null));
            return data.access === "Authorized" ? true : false;
        }
        catch (error) {
            console.error("❌ Redis Authentication Failed!", error);
            return false;
        }
    }
    // 🔹 Set a key-value pair with optional expiration
    async set(key, value, ttl) {
        try {
            const params = new URLSearchParams({
                key,
                value: JSON.stringify(value),
            });
            const response = await fetch(`${this.baseURL}/api/v1/set?${params.toString()}`, {
                method: "POST",
                headers: this.getHeaders(),
            });
            const data = (await response.json().catch(() => null));
            if (ttl) {
                await this.expire(key, ttl);
            }
            return data?.success === true;
        }
        catch (error) {
            console.error("❌ Redis SET failed!", error);
            return false;
        }
    }
    // 🔹 Get a value by key
    async get(key) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/get/${key}`, {
                method: "GET",
                headers: this.getHeaders(),
            });
            const data = (await response.json().catch(() => null));
            return data?.success === true ? JSON.parse(data.GET) : null;
        }
        catch (error) {
            console.error("❌ Redis GET failed!", error);
            return null;
        }
    }
    // 🔹 Delete a key
    async del(key) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/del/${key}`, {
                method: "DELETE",
                headers: this.getHeaders(),
            });
            const data = (await response.json().catch(() => null));
            return data?.success === true;
        }
        catch (error) {
            console.error("❌ Redis DELETE failed!", error);
            return false;
        }
    }
    // 🔹 Expire a key
    async expire(key, ttl) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/expire/${key}/${ttl}`, {
                method: "POST",
                headers: this.getHeaders(),
            });
            const data = (await response.json().catch(() => null));
            return data?.success === true;
        }
        catch (error) {
            console.error("❌ Redis EXPIRE failed!", error);
            return false;
        }
    }
    // 🔹 Rate limiter (increment + optional TTL)
    async rateLimit(key, maxRequests, ttl) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/incr/${key}`, {
                method: "POST",
                headers: this.getHeaders(),
            });
            const data = (await response.json().catch(() => null));
            const currentCount = data?.INCR || 0;
            if (ttl && currentCount === 1) {
                await this.expire(key, ttl);
            }
            return currentCount <= maxRequests;
        }
        catch (error) {
            console.error("❌ Redis Rate Limit failed!", error);
            return false;
        }
    }
    // 🔹 Add value to a Redis set
    async sadd(key, value) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/sadd`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ key, value }),
            });
            const data = (await response.json().catch(() => null));
            return data?.SADD === 1;
        }
        catch (error) {
            console.error("❌ Redis SADD failed!", error);
            return false;
        }
    }
    // 🔹 Remove value from a Redis set
    async srem(key, value) {
        try {
            const response = await fetch(`${this.baseURL}/api/v1/srem`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ key, value }),
            });
            const data = (await response.json().catch(() => null));
            return data?.SREM === 1;
        }
        catch (error) {
            console.error("❌ Redis SREM failed!", error);
            return false;
        }
    }
}
