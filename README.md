# NutriTrack 🥗

Aplicación web (PWA) de seguimiento nutricional diario para Jorge.

## Características

- **Checklist diario** con guardado automático al tocar cada item
- **Disponibilidad horaria**: items se habilitan según la hora del día
- **Nota obligatoria**: overlay bloqueante después de las 9:00 PM
- **Progreso de peso**: gráfica semanal con Chart.js, registro solo los lunes
- **Historial**: últimos 30 días con código de colores
- **Notificaciones**: alertas en horarios clave del día
- **Modo oscuro**: incluido, con toggle en el header
- **PWA instalable**: se puede agregar al homescreen como app nativa
- **Sin backend**: todo funciona con localStorage, sin servidor

## Datos del plan

| Dato | Valor |
|------|-------|
| Peso inicial | 106.7 kg |
| Meta | 84.5 kg |
| Hito motivador | 100 kg |
| Primer pesaje | Lunes 6 de abril de 2026 |
| Días de gym | Lunes a Viernes |
| Hora gym | 6:00 AM |

## Despliegue en GitHub Pages (gratis)

1. Crear un repositorio en GitHub (ej: `nutritrack`)
2. Subir todos los archivos del proyecto
3. Ir a **Settings > Pages**
4. En "Source" seleccionar **Deploy from a branch**
5. Seleccionar `main` branch y `/ (root)`
6. Guardar. En ~1 minuto estará disponible en:
   `https://TU-USUARIO.github.io/nutritrack/`

### Pasos con Git:

```bash
cd NutriTrack
git init
git add .
git commit -m "NutriTrack v1.0"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/nutritrack.git
git push -u origin main
```

## Estructura del proyecto

```
NutriTrack/
├── index.html          # Checklist diario (página principal)
├── progreso.html       # Gráfica y registro de peso
├── historial.html      # Últimos 30 días
├── config.html         # Configuración
├── sw.js               # Service Worker (cache + notificaciones)
├── manifest.json       # PWA manifest
├── css/
│   └── app.css         # Estilos (light + dark mode)
├── js/
│   ├── storage.js      # Capa de persistencia (localStorage)
│   ├── app.js          # Lógica del checklist y páginas
│   ├── notifications.js # Sistema de notificaciones
│   └── charts.js       # Gráficas con Chart.js
└── README.md
```

## Notificaciones

Las notificaciones usan la **Notification API** del navegador. Funcionan:
- ✅ Cuando la app está abierta en el navegador
- ✅ Cuando la PWA está instalada en Android
- ⚠️ En iOS requiere instalar como PWA desde Safari (16.4+)

| Notificación | Hora | Días |
|---|---|---|
| Pre-entreno | 05:45 | Lun-Vie |
| Recordatorio gym | 05:55 | Lun-Vie |
| Pesaje | 06:30 | Lunes |
| Desayuno post-gym | 07:05 | Lun-Vie |
| Merienda mañana | 10:00 | Todos |
| Almuerzo | 12:30 | Todos |
| Merienda tarde | 15:30 | Todos |
| Cena | 19:00 | Todos |
| Cierre del día | 20:45 | Todos |

## Tecnologías

- HTML5 + CSS3 + JavaScript vanilla (sin frameworks)
- Chart.js vía CDN (gráficas de peso)
- Service Worker (cache offline + notificaciones)
- localStorage (persistencia sin servidor)

## Backup de datos

Desde **Configuración > Datos**:
- **Exportar**: descarga un archivo JSON con todos tus datos
- **Importar**: restaura datos desde un backup previo

---

NutriTrack v1.0 — Abril 2026
