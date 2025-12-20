class TwoBolsosAPI {
    constructor(baseUrl = "") {
        this.baseUrl = baseUrl;
    }

    async _request(endpoint, method = "GET", body = null) {
        const options = {
            method,
            headers: { "Content-Type": "application/json" },
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, options);
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
    async getFixas(negocioId) { return this._request(`/negocios/${negocioId}/fixas`); } // Note: Route path we defined
    async createFixa(data) { return this._request("/fixas", "POST", data); }
    async deleteFixa(id) { return this._request(`/fixas/${id}`, "DELETE"); }
    async payFixa(id) { return this._request(`/fixas/${id}/pagar`, "POST"); }
}

export const api = new TwoBolsosAPI();
