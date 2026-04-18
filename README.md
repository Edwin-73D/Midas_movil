# Midas App

App móvil de finanzas personales construida con Expo y React Native.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Expo Go](https://expo.dev/go) instalado en tu celular (disponible en Play Store y App Store)

## Instalación

1. Clona el repositorio:

```bash
git clone git@github.com:Edwin-73D/Midas_movil.git
cd midas-app
```

2. Instala las dependencias:

```bash
npm install
```

## Ejecutar el proyecto

```bash
npm start
```

Se abrirá una terminal con un código QR.

- **Android:** abre Expo Go y escanea el QR desde la app
- **iPhone:** escanea el QR con la cámara nativa

> Tu celular y tu computadora deben estar conectados a la **misma red WiFi**.

### Si la conexión falla

Usa el modo tunnel (enruta por internet, no requiere misma red):

```bash
npm start -- --tunnel
```

Si te pide instalar `@expo/ngrok`, acepta.
