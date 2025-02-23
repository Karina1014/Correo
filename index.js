import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';  // Para cargar las variables de entorno

dotenv.config();  // Cargar variables de entorno desde .env

const app = express();
app.use(express.json());

// Verificar que las variables de entorno necesarias estén definidas
if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SENDER_EMAIL) {
    console.error('Faltan las variables de entorno SMTP_USER, SMTP_PASS o SENDER_EMAIL');
    process.exit(1);  // Detener la ejecución si faltan las variables
}

// Configurar el transporte de Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,  // Deshabilitar la validación del certificado
    },
});

// Verificar la conexión al servidor SMTP
const verifySMTPConnection = async () => {
    try {
        await transporter.verify();
        console.log('Conexión exitosa con SMTP');
    } catch (error) {
        console.error('Error al conectar con SMTP:', error);
        process.exit(1);  // Detener la ejecución si no se puede conectar
    }
};
verifySMTPConnection();

// Ruta POST para enviar correo
app.post('/enviar-correo', async (req, res) => {
    const { email, estadoReclamo } = req.body;  // Se espera que el cuerpo de la solicitud tenga "email" y "estadoReclamo"
    
    if (!email || !estadoReclamo) {
        return res.status(400).json({ success: false, message: 'El correo electrónico y el estado del reclamo son requeridos' });
    }

    // Verificar que el estado del reclamo sea válido
    if (estadoReclamo !== 'aceptado' && estadoReclamo !== 'rechazado') {
        return res.status(400).json({ success: false, message: 'Estado de reclamo inválido. Debe ser "aceptado" o "rechazado".' });
    }

    // Establecer el mensaje según el estado del reclamo
    const asunto = estadoReclamo === 'aceptado' ? 'Su reclamo ha sido aceptado' : 'Su reclamo ha sido rechazado';
    const texto = estadoReclamo === 'aceptado'
        ? `Estimado cliente, su reclamo ha sido aceptado. Procederemos con los pasos necesarios para resolverlo.`
        : `Estimado cliente, su reclamo ha sido rechazado. Lamentamos informarle que no cumplió con los requisitos necesarios.`;

    try {
        const mailOptions = {
            from: process.env.SENDER_EMAIL,  // El correo de quien envía
            to: email,                      // El correo destinatario
            subject: asunto,                // Asunto del correo
            text: texto,                    // Cuerpo del correo (mensaje sobre el estado del reclamo)
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'Correo enviado correctamente' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ success: false, message: 'No se pudo enviar el correo' });
    }
});

// Iniciar el servidor
const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
