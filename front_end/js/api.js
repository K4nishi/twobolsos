class TwoBolsosAPI {
    constructor(baseUrl = "") {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
        window.location.reload();
    }

    async _request(endpoint, method = "GET", body = null) {
        const options = {
            method,
            headers: { "Content-Type": "application/json" },
        };
        if (this.token) {
            options.headers["Authorization"] = `Bearer ${this.token}`;
        }

        if (body) {
            if (body instanceof FormData) {
                delete options.headers["Content-Type"]; // Let browser set boundary
                options.body = body;
            } else {
                options.body = JSON.stringify(body);
            }
        }

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, options);
            if (res.status === 401) {
                this.logout();
                throw new Error("Sessão expirada");
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Erro na requisição");
            }
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    // Auth
    async login(username, password) {
        const form = new FormData();
        form.append('username', username);
        form.append('password', password);
        return this._request("/auth/token", "POST", form);
    }

    async register(data) {
        return this._request("/auth/register", "POST", data);
    }

    // Negocios
    async getNegocios() { return this._request("/negocios"); }
    async createNegocio(data) { return this._request("/negocios", "POST", data); }
    async deleteNegocio(id) { return this._request(`/negocios/${id}`, "DELETE"); }

    // Dashboard & Details
    async getDashboard(id, dias = 7) {
        return this._request(`/negocios/${id}/dashboard?dias=${dias}`);
    }

    // Transacoes
    async createTransacao(data) { return this._request("/transacoes", "POST", data); }
    async deleteTransacao(id) { return this._request(`/transacoes/${id}`, "DELETE"); }

    // Fixas
    async getFixas(negocioId) { return this._request(`/negocios/${negocioId}/fixas`); }
    async createFixa(data) { return this._request("/fixas", "POST", data); }
    async deleteFixa(id) { return this._request(`/fixas/${id}`, "DELETE"); }
    async payFixa(id) { return this._request(`/fixas/${id}/pagar`, "POST"); }

    // Sharing
    async createInvite(id) { return this._request(`/negocios/${id}/invite`, "POST"); }
    async joinNegocio(code) { return this._request(`/negocios/join?code=${code}`, "POST"); }
    async getMembers(id) { return this._request(`/negocios/${id}/members`); }
    async removeMember(negocioId, userId) { return this._request(`/negocios/${negocioId}/members/${userId}`, "DELETE"); }
}

export const api = new TwoBolsosAPI();
