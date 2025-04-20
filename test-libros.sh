#!/bin/bash
# Secuencia de comandos CURL para probar el sistema de gestión de libros

# Ajuste estos parámetros a su entorno
BASE_URL="http://localhost:5000"

# Colores para mensajes en consola
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin Color

# Función para obtener tokens de autenticación
obtener_tokens() {
  echo -e "${YELLOW}Obteniendo tokens de autenticación...${NC}"

  # 1. Login como usuario root
  echo -e "\n${YELLOW}1. Login como root...${NC}"
  ROOT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "root@librosfera.com",
      "password": "Root12345!"
    }')
  
  ROOT_TOKEN=$(echo $ROOT_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2- | tr -d '"')
  
  if [ -z "$ROOT_TOKEN" ]; then
    echo -e "${RED}Error: No se pudo obtener el token de root${NC}"
    exit 1
  else
    echo -e "${GREEN}Token de root obtenido correctamente${NC}"
  fi

  # 2. Crear usuario administrador (o login si ya existe)
  echo -e "\n${YELLOW}2. Creando/obteniendo usuario administrador...${NC}"
  ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/admin" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ROOT_TOKEN" \
    -d '{
      "email": "admin_test@example.com",
      "password": "AdminPass123!",
      "usuario": "admin_test"
    }')
  
  ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2- | tr -d '"')
  
  # Si no se pudo crear, intentar login
  if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}Administrador posiblemente ya existe, intentando login...${NC}"
    ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin_test@example.com",
        "password": "AdminPass123!"
      }')
    
    ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2- | tr -d '"')
    
    if [ -z "$ADMIN_TOKEN" ]; then
      echo -e "${RED}Error: No se pudo obtener el token de administrador${NC}"
      exit 1
    else
      echo -e "${GREEN}Token de administrador obtenido por login${NC}"
    fi
  else
    echo -e "${GREEN}Token de administrador obtenido por creación${NC}"
  fi

  # 3. Crear usuario normal (o login si ya existe)
  echo -e "\n${YELLOW}3. Creando/obteniendo usuario normal...${NC}"
  USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/register" \
    -H "Content-Type: application/json" \
    -d '{
      "usuario": "cliente_test",
      "email": "cliente_test@example.com",
      "password": "Password123!",
      "tipo_usuario": "cliente",
      "DNI": "12345678T",
      "nombres": "Cliente",
      "apellidos": "Test",
      "fecha_nacimiento": "1990-01-15",
      "lugar_nacimiento": "Madrid",
      "genero": "Masculino",
      "direcciones": [{
        "calle": "Calle Test 123", 
        "ciudad": "Madrid", 
        "codigo_postal": "28001", 
        "pais": "España"
      }],
      "telefono": "+34612345678"
    }')
  
  USER_TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2- | tr -d '"')
  
  # Si no se pudo crear, intentar login
  if [ -z "$USER_TOKEN" ]; then
    echo -e "${YELLOW}Usuario posiblemente ya existe, intentando login...${NC}"
    USER_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/users/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "cliente_test@example.com",
        "password": "Password123!"
      }')
    
    USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d':' -f2- | tr -d '"')
    
    if [ -z "$USER_TOKEN" ]; then
      echo -e "${RED}Error: No se pudo obtener el token de usuario${NC}"
      exit 1
    else
      echo -e "${GREEN}Token de usuario obtenido por login${NC}"
    fi
  else
    echo -e "${GREEN}Token de usuario obtenido por creación${NC}"
  fi

  echo -e "\n${GREEN}Tokens obtenidos con éxito:${NC}"
  echo -e "ADMIN_TOKEN: ${YELLOW}$ADMIN_TOKEN${NC}"
  echo -e "USER_TOKEN: ${YELLOW}$USER_TOKEN${NC}\n"
}

# Función para imprimir respuesta del servidor
print_response() {
  local response=$1
  local title=$2
  
  echo -e "${BLUE}--- RESPUESTA: $title ---${NC}"
  echo "$response"
  echo -e "${BLUE}--- FIN DE RESPUESTA ---${NC}\n"
}

# Obtener los tokens antes de ejecutar las pruebas
obtener_tokens

# Crear libro
echo -e "${YELLOW}1. Creando un nuevo libro...${NC}"
CREAR_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "titulo": "El Código Da Vinci",
    "autor": [{"nombre": "Dan", "apellidos": "Brown", "nacionalidad": "Estados Unidos"}],
    "editorial": "Planeta",
    "genero": "Misterio",
    "idioma": "Español",
    "fecha_publicacion": "2003-03-18",
    "anio_publicacion": 2003,
    "numero_paginas": 560,
    "precio": 42000,
    "estado": "nuevo",
    "stock": 10,
    "descripcion": "Un asesinato en el museo del Louvre y una serie de pistas enigmáticas escondidas en las obras de Leonardo da Vinci."
  }')

print_response "$CREAR_RESPUESTA" "CREAR LIBRO"

# Extraer ID del libro - CORREGIDO: Tomamos el ID principal del objeto data
LIBRO_ID=$(echo "$CREAR_RESPUESTA" | jq -r '.data._id')

echo -e "${GREEN}ID del libro creado: $LIBRO_ID${NC}"

# Obtener libro por ID
echo -e "\n${YELLOW}2. Obteniendo detalles del libro...${NC}"
OBTENER_RESPUESTA=$(curl -s -X GET "$BASE_URL/api/v1/libros/$LIBRO_ID")
print_response "$OBTENER_RESPUESTA" "OBTENER LIBRO"

# Actualizar libro
echo -e "\n${YELLOW}3. Actualizando el libro...${NC}"
ACTUALIZAR_RESPUESTA=$(curl -s -X PUT "$BASE_URL/api/v1/libros/$LIBRO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "precio": 45000,
    "stock": 15,
    "palabras_clave": ["misterio", "arte", "religión", "código", "Davinci"]
  }')
print_response "$ACTUALIZAR_RESPUESTA" "ACTUALIZAR LIBRO"

# Agregar ejemplar
echo -e "\n${YELLOW}4. Agregando un ejemplar al libro...${NC}"
EJEMPLAR_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/ejemplares" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "codigo": "DV001",
    "estado_fisico": "excelente",
    "ubicacion": "Bodega Norte"
  }')
print_response "$EJEMPLAR_RESPUESTA" "AGREGAR EJEMPLAR"

# Verificar si existe una imagen de prueba, si no, crear una genérica
if [ ! -f "imagen.jpg" ]; then
  echo -e "${YELLOW}Imagen de prueba no encontrada. Creando una imagen genérica...${NC}"
  # Usar caracteres ASCII para crear un archivo simple
  echo -e "P6\n10 10\n255\n" > imagen.ppm
  for i in {1..300}; do  # 10x10x3 bytes (RGB para cada píxel)
    printf "%c%c%c" $(($RANDOM % 256)) $(($RANDOM % 256)) $(($RANDOM % 256)) >> imagen.ppm
  done
  # Intentando convertir a jpg con ImageMagick si está disponible
  if command -v convert &> /dev/null; then
    convert imagen.ppm imagen.jpg
    rm imagen.ppm
    echo -e "${GREEN}Imagen de prueba creada: imagen.jpg${NC}"
  else
    mv imagen.ppm imagen.jpg
    echo -e "${YELLOW}ImageMagick no disponible. Usando archivo de prueba imagen.jpg (podría no ser válido)${NC}"
  fi
fi

# Subir imagen
echo -e "\n${YELLOW}5. Subiendo una imagen para el libro...${NC}"
IMAGEN_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/imagenes" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "imagen=@imagen.jpg" \
  -F "tipo=portada" \
  -F "orden=0" \
  -F "alt_text=Portada de El Código Da Vinci")
print_response "$IMAGEN_RESPUESTA" "SUBIR IMAGEN"

# Agregar descuento
echo -e "\n${YELLOW}6. Agregando un descuento al libro...${NC}"
DESCUENTO_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/descuentos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "tipo": "porcentaje",
    "valor": 10,
    "fecha_inicio": "2023-05-20T00:00:00.000Z",
    "fecha_fin": "2033-12-31T23:59:59.999Z",
    "codigo_promocion": "NUEVO10"
  }')
print_response "$DESCUENTO_RESPUESTA" "AGREGAR DESCUENTO"

# Listar libros con filtros
echo -e "\n${YELLOW}7. Listando libros con filtros...${NC}"
LISTAR_RESPUESTA=$(curl -s -X GET "$BASE_URL/api/v1/libros?genero=Misterio&limit=5")
print_response "$LISTAR_RESPUESTA" "LISTAR LIBROS"

# Buscar libros
echo -e "\n${YELLOW}8. Buscando libros...${NC}"
BUSQUEDA_RESPUESTA=$(curl -s -X GET "$BASE_URL/api/v1/libros/buscar?q=codigo%20davinci")
print_response "$BUSQUEDA_RESPUESTA" "BUSCAR LIBROS"

BUSQUEDA_ID=$(echo $BUSQUEDA_RESPUESTA | grep -o '"id_busqueda":"[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}ID de búsqueda: $BUSQUEDA_ID${NC}"

# Registrar interacción con un libro
if [ ! -z "$BUSQUEDA_ID" ]; then
  echo -e "\n${YELLOW}9. Registrando interacción con el libro...${NC}"
  INTERACCION_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/buscar/$BUSQUEDA_ID/interaccion/$LIBRO_ID")
  print_response "$INTERACCION_RESPUESTA" "REGISTRAR INTERACCIÓN"
else
  echo -e "\n${RED}No se pudo registrar interacción porque no se obtuvo ID de búsqueda${NC}"
fi

# Calificar libro
echo -e "\n${YELLOW}10. Calificando el libro...${NC}"
CALIFICAR_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/calificacion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "calificacion": 4.5
  }')
print_response "$CALIFICAR_RESPUESTA" "CALIFICAR LIBRO"

# Reservar stock
echo -e "\n${YELLOW}11. Reservando stock del libro...${NC}"
RESERVAR_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/reservar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "cantidad": 2,
    "id_reserva": "reserva_test_12345"
  }')
print_response "$RESERVAR_RESPUESTA" "RESERVAR STOCK"

# Liberar stock
echo -e "\n${YELLOW}12. Liberando stock del libro...${NC}"
LIBERAR_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/liberar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "cantidad": 1,
    "id_reserva": "reserva_test_12345"
  }')
print_response "$LIBERAR_RESPUESTA" "LIBERAR STOCK"

# Obtener libros con descuento
echo -e "\n${YELLOW}13. Obteniendo libros con descuento...${NC}"
DESCUENTOS_RESPUESTA=$(curl -s -X GET "$BASE_URL/api/v1/libros/descuentos?limit=5")
print_response "$DESCUENTOS_RESPUESTA" "LIBROS CON DESCUENTO"

# Obtener libros destacados
echo -e "\n${YELLOW}14. Obteniendo libros destacados...${NC}"
DESTACADOS_RESPUESTA=$(curl -s -X GET "$BASE_URL/api/v1/libros/destacados?limit=5")
print_response "$DESTACADOS_RESPUESTA" "LIBROS DESTACADOS"

# Obtener recomendaciones
echo -e "\n${YELLOW}15. Obteniendo recomendaciones personalizadas...${NC}"
RECOMENDACIONES_RESPUESTA=$(curl -s -X GET "$BASE_URL/api/v1/libros/recomendaciones?limit=3" \
  -H "Authorization: Bearer $USER_TOKEN")
print_response "$RECOMENDACIONES_RESPUESTA" "RECOMENDACIONES"

# Confirmar compra
echo -e "\n${YELLOW}16. Confirmando compra de libro...${NC}"
COMPRA_RESPUESTA=$(curl -s -X POST "$BASE_URL/api/v1/libros/$LIBRO_ID/comprar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "cantidad": 1,
    "id_transaccion": "tx_test_12345",
    "id_reserva": "reserva_test_12345"
  }')
print_response "$COMPRA_RESPUESTA" "CONFIRMAR COMPRA"

# Eliminar libro (desactivar)
echo -e "\n${YELLOW}17. Desactivando el libro...${NC}"
ELIMINAR_RESPUESTA=$(curl -s -X DELETE "$BASE_URL/api/v1/libros/$LIBRO_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
print_response "$ELIMINAR_RESPUESTA" "DESACTIVAR LIBRO"

echo -e "\n${GREEN}Pruebas completadas.${NC}"