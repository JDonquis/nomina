<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a bordo</title>
</head>

<body
    style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1f2937;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0"
                    style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="background-color: #2563eb; padding: 20px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">¡Bienvenido a bordo,
                                {{ $user->full_name }}!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; color: #4b5563; line-height: 1.6;">
                            <p style="font-size: 16px; margin: 0 0 20px;">
                                Estamos emocionados de tenerte como usuario en
                                <strong>{{ config('app.name') }}</strong>. Para comenzar, configura tu contraseña
                                haciendo clic en el siguiente botón:
                            </p>
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="{{ config('app.frontend_url') . '/set-password?token=' . $token }}"
                                    style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px; text-align: center;">
                                    Establecer mi contraseña
                                </a>
                            </p>
                            <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                                <br>
                                <a href="{{ config('app.frontend_url') . '/set-password?token=' . $token . '&email=' . urlencode($user->email) }}"
                                    style="color: #2563eb; text-decoration: underline; word-break: break-all;">
                                    {{ config('app.frontend_url') . '/set-password?token=' . $token }}
                                </a>
                            </p>
                            <p style="font-size: 14px; color: #6b7280; margin: 20px 0;">
                                Este enlace expirará en 15 minutos. Si no solicitaste esta cuenta, ignora este correo.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                            <p style="margin: 0;">
                                &copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.
                            </p>
                            <p style="margin: 10px 0 0;">
                                ¿Tienes preguntas? Contáctanos en
                                <a href="mailto:support@{{ parse_url(config('app.frontend_url'), PHP_URL_HOST) }}"
                                    style="color: #2563eb; text-decoration: underline;">
                                    support{{ '@' . parse_url(config('app.frontend_url'), PHP_URL_HOST) }}
                                </a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
