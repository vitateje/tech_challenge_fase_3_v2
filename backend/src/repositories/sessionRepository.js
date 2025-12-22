const Session = require('../models/Session');

async function create(data) {
    try {
        const session = new Session(data);
        await session.save();
        return session;
    } catch (error) {
        throw new Error(`Erro ao criar sessão: ${error.message}`);
    }
}

async function getBySessionId(sessionId) {
    try {
        const session = await Session.findOne({ sessionId }).populate('userId');
        return session;
    } catch (error) {
        throw new Error(`Erro ao buscar sessão: ${error.message}`);
    }
}

async function getByUserId(userId) {
    try {
        const sessions = await Session.find({ userId }).populate('userId');
        return sessions;
    } catch (error) {
        throw new Error(`Erro ao buscar sessões do usuário: ${error.message}`);
    }
}

async function deleteBySessionId(sessionId) {
    try {
        const result = await Session.findOneAndDelete({ sessionId });
        return !!result;
    } catch (error) {
        throw new Error(`Erro ao deletar sessão: ${error.message}`);
    }
}

async function deleteByUserId(userId) {
    try {
        const result = await Session.deleteMany({ userId });
        return result.deletedCount;
    } catch (error) {
        throw new Error(`Erro ao deletar sessões do usuário: ${error.message}`);
    }
}

async function updateLastActivity(sessionId) {
    try {
        const session = await Session.findOneAndUpdate(
            { sessionId },
            { lastActivity: new Date() },
            { new: true }
        );
        return session;
    } catch (error) {
        throw new Error(`Erro ao atualizar atividade da sessão: ${error.message}`);
    }
}

async function cleanupExpired() {
    try {
        const result = await Session.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        return result.deletedCount;
    } catch (error) {
        throw new Error(`Erro ao limpar sessões expiradas: ${error.message}`);
    }
}

async function getAll() {
    try {
        const sessions = await Session.find().populate('userId');
        return sessions;
    } catch (error) {
        throw new Error(`Erro ao buscar todas as sessões: ${error.message}`);
    }
}

module.exports = {
    create,
    getBySessionId,
    getByUserId,
    deleteBySessionId,
    deleteByUserId,
    updateLastActivity,
    cleanupExpired,
    getAll
};
