export interface Negocio {
    id: number;
    nome: string;
    categoria: string;
    cor: string;
    saldo: number;
    role: string;
    owner_name: string;
    owner_id: number;
}

export interface User {
    id: number;
    username: string;
}

export interface Transacao {
    id: number;
    valor: number;
    descricao: string;
    tag: string;
    tipo: 'receita' | 'despesa';
    data: string;
    created_by_name: string;
    km?: number;
    litros?: number;
}

export interface KPI {
    receita: number;
    despesa: number;
    saldo: number;
    total_km?: number;
    total_litros?: number;
    autonomia?: number;
    rendimento?: number;
}

export interface ChartData {
    labels: string[];
    receitas: number[];
    despesas: number[];
}

export interface DespesaFixa {
    id: number;
    nome: string;
    valor: number;
    tag: string;
    dia_vencimento: number;
}
