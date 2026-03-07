import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Librosfera';
const SITE_URL = 'https://librosfera.jerik.dev';
const DEFAULT_IMAGE = `${SITE_URL}/logo512.png`;
const DEFAULT_DESCRIPTION =
  'Librosfera es tu librería online. Encuentra libros de todas las categorías con descuentos y envío a domicilio.';

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} - Tu Librería Online | Compra Libros`;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      <html lang="es" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta
        name="robots"
        content={noIndex ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
