const jwt = require('jsonwebtoken');

exports.proteger = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ erro: "Não autorizado, token em falta" });
    }

    try {
        const descodificado = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao');
        
        // Injeta a informação do utilizador logado no Request!
        req.utilizadorInfo = {
            id: descodificado.id,
            tipo: descodificado.tipo
        };
        
        next();
    } catch (err) {
        return res.status(401).json({ erro: "Não autorizado, token inválido" });
    }
};


exports.restringirA = (...tipos) => {
    return (req, res, next) => {
        if (!tipos.includes(req.utilizadorInfo.tipo)) {
            return res.status(403).json({ erro: "Não tem permissão para realizar esta ação" });
        }
        next();
    };
};