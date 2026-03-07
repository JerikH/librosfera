import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://librosfera.jerik.dev';

export const OrganizationSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Librosfera',
    url: SITE_URL,
    logo: `${SITE_URL}/logo512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'Spanish',
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const WebSiteSchema = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Librosfera',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const BookProductSchema = ({ book }) => {
  if (!book) return null;

  const imageUrl =
    book.imagenes && book.imagenes.length > 0
      ? book.imagenes[0].url
      : `${SITE_URL}/logo512.png`;

  const price = book.precio || 0;
  const hasStock =
    book.stock_disponible !== undefined ? book.stock_disponible > 0 : true;
  const availability = hasStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.titulo,
    author: {
      '@type': 'Person',
      name: book.autor_nombre_completo,
    },
    ...(book.editorial && {
      publisher: {
        '@type': 'Organization',
        name: book.editorial,
      },
    }),
    ...(book.anio_publicacion && {
      datePublished: `${book.anio_publicacion}-01-01`,
    }),
    ...(book.idioma && { inLanguage: book.idioma }),
    ...(book.numero_paginas && { numberOfPages: book.numero_paginas }),
    image: imageUrl,
    description:
      book.descripcion ||
      `${book.titulo} por ${book.autor_nombre_completo} en Librosfera.`,
    url: `${SITE_URL}/libro/${book._id}`,
    bookFormat: 'https://schema.org/Paperback',
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'COP',
      availability,
      url: `${SITE_URL}/libro/${book._id}`,
      seller: {
        '@type': 'Organization',
        name: 'Librosfera',
      },
    },
    ...(book.calificaciones &&
      book.calificaciones.cantidad > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: book.calificaciones.promedio,
          reviewCount: book.calificaciones.cantidad,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const ItemListSchema = ({ books = [], listName, listUrl }) => {
  if (!books.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName || 'Catálogo de Libros',
    url: listUrl ? `${SITE_URL}${listUrl}` : `${SITE_URL}/libros`,
    itemListElement: books.slice(0, 20).map((book, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/libro/${book._id}`,
      name: book.titulo,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const BreadcrumbSchema = ({ items = [] }) => {
  if (!items.length) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: `${SITE_URL}${item.url}` }),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
