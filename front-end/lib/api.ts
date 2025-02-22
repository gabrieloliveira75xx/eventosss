import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eventos.grupoglk.com.br';

// Table Management Endpoints
export const getTables = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/tables`);
        return response.data;
    } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
    }
};

export const getAvailableTables = async (type?: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/tables/available`, {
            params: { type }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching available tables:', error);
        throw error;
    }
};

export const reserveTable = async (tableId: string, reservation: { table_id: string, purchase_id: string }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/tables/${tableId}/reserve`, reservation);
        return response.data;
    } catch (error) {
        console.error('Error reserving table:', error);
        throw error;
    }
};

// Purchase and Payment Endpoints
export const iniciarCompra = async (purchase: {
    nome: string,
    sobrenome: string,
    telefone: string,
    conviteType: string,
    mesa: boolean,
    estacionamento: boolean,
    amount: number,
    vendedor_code?: string
}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/iniciar-compra`, purchase);
        return response.data;
    } catch (error) {
        console.error('Error initiating purchase:', error);
        throw error;
    }
};

export const criarPagamentoCartaoCredito = async (paymentData: {
    payment_method_id: string,
    token: string,
    transaction_amount: number,
    payer: { first_name: string, last_name: string },
    statement_descriptor: string,
    external_reference: string,
    vendedor_code?: string // Adicionado vendedor_code
}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/criar-pagamento-cartao-credito`, paymentData);
        return response.data;
    } catch (error) {
        console.error('Error creating credit card payment:', error);
        throw error;
    }
};

export const criarPagamentoCartaoDebito = async (paymentData: {
    payment_method_id: string,
    token: string,
    transaction_amount: number,
    payer: { first_name: string, last_name: string },
    statement_descriptor: string,
    external_reference: string,
    vendedor_code?: string // Adicionado vendedor_code
}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/criar-pagamento-cartao-debito`, paymentData);
        return response.data;
    } catch (error) {
        console.error('Error creating debit card payment:', error);
        throw error;
    }
};

export const criarPagamentoPix = async (paymentData: {
    payment_method_id: string,
    transaction_amount: number,
    payer: { first_name: string, last_name: string },
    external_reference: string,
    notification_url: string,
    vendedor_code?: string // Adicionado vendedor_code
}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/criar-pagamento-pix`, paymentData);
        return response.data;
    } catch (error) {
        console.error('Error creating PIX payment:', error);
        throw error;
    }
};

export const statusCompra = async (externalReference: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/status-compra/${externalReference}`);
        return response.data;
    } catch (error) {
        console.error('Error checking purchase status:', error);
        throw error;
    }
};

// Vendor Sales Endpoints
export const registrarVenda = async (vendedorCode: string, paymentInfo: {
    id: string,
    external_reference: string,
    transaction_amount: number,
    status: string
}) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/registrar-venda`, {
            vendedor_code: vendedorCode,
            payment_info: paymentInfo
        });
        return response.data;
    } catch (error) {
        console.error('Error registering sale:', error);
        throw error;
    }
};

// Mercado Pago Webhook
export const mercadopagoWebhook = async (payload: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/webhook`, payload);
        return response.data;
    } catch (error) {
        console.error('Error processing Mercado Pago webhook:', error);
        throw error;
    }
};