# CREDIPASS — serveur central (API + PWA) avec OCR
FROM node:22-bookworm-slim

# OCR serveur : tesseract (français + anglais) et pdftoppm (Poppler) pour les PDF.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-fra poppler-utils \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Dans un conteneur, le serveur doit écouter sur toutes les interfaces.
ENV CREDIPASS_HOST=0.0.0.0 \
    PORT=8092
EXPOSE 8092

USER node

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8092)+'/api/health').then(r=>r.json()).then(j=>process.exit(j.ok&&j.database?.connected?0:1)).catch(()=>process.exit(1))"

CMD ["node", "scripts/boot.mjs"]
