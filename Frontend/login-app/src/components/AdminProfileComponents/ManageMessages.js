import React, { useState, useEffect } from 'react';

const ManageMessages = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unread', 'read', 'answered'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simular carga de mensajes
    const fetchMessages = async () => {
      try {
        // Aquí iría una llamada API real para obtener mensajes
        // Simulamos una respuesta después de un segundo
        setTimeout(() => {
          const dummyMessages = [
            { 
              id: 1, 
              sender: 'María López', 
              email: 'maria@ejemplo.com', 
              subject: 'Consulta sobre pedido #12345', 
              content: 'Buenas tardes, quería consultar sobre el estado de mi pedido #12345. Hace una semana que realicé la compra y aún no he recibido información sobre el envío. Gracias.',
              date: '2023-11-10 14:25:30', 
              status: 'unread' 
            },
            { 
              id: 2, 
              sender: 'Carlos Rodríguez', 
              email: 'carlos@ejemplo.com', 
              subject: 'Problema con la descarga del ebook', 
              content: 'Hola, compré el ebook "Historia Contemporánea" pero estoy teniendo problemas para descargarlo. El enlace que recibí por correo me da un error 404. ¿Podrían ayudarme a solucionarlo? Saludos cordiales.',
              date: '2023-11-09 11:30:15', 
              status: 'read' 
            },
            { 
              id: 3, 
              sender: 'Ana García', 
              email: 'ana@ejemplo.com', 
              subject: 'Solicitud de colaboración', 
              content: 'Estimados, soy escritora y me gustaría proponer una colaboración para promocionar mi nuevo libro en su plataforma. ¿Podrían indicarme cuál es el proceso para presentar una propuesta formal? Muchas gracias.',
              date: '2023-11-08 16:45:22', 
              status: 'answered' 
            },
            { 
              id: 4, 
              sender: 'Pedro Sánchez', 
              email: 'pedro@ejemplo.com', 
              subject: 'Sugerencia para la web', 
              content: 'Hola, soy un cliente habitual y me encantaría que añadieran una función para guardar libros en una lista de deseos. Creo que sería muy útil para todos los usuarios. Un saludo.',
              date: '2023-11-07 09:15:40', 
              status: 'unread' 
            },
            { 
              id: 5, 
              sender: 'Laura Martínez', 
              email: 'laura@ejemplo.com', 
              subject: 'Devolución de libro dañado', 
              content: 'Buenos días, recibí mi pedido ayer pero el libro "El nombre del viento" vino con la portada rasgada. Me gustaría solicitar un cambio o devolución. Adjunto fotos del estado en que llegó. Gracias por su atención.',
              date: '2023-11-06 13:50:10', 
              status: 'read' 
            },
            { 
              id: 6, 
              sender: 'Roberto Fernández', 
              email: 'roberto@ejemplo.com', 
              subject: 'Consulta disponibilidad', 
              content: 'Hola, estoy interesado en comprar 20 unidades del libro "Matemáticas para primaria" para un colegio. ¿Podrían confirmarme si tienen stock disponible y si ofrecen algún descuento por cantidad? Gracias.',
              date: '2023-11-05 10:20:35', 
              status: 'answered' 
            },
          ];
          setMessages(dummyMessages);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Filtrar mensajes
  const filteredMessages = messages.filter(message => {
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesSearch = 
      message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Abrir modal con detalles del mensaje
  const openMessageDetail = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
    
    // Si el mensaje está sin leer, marcarlo como leído
    if (message.status === 'unread') {
      // En un caso real, aquí haría una llamada a la API
      // Por ahora, simplemente actualizamos el estado local
      const updatedMessages = messages.map(msg => 
        msg.id === message.id ? { ...msg, status: 'read' } : msg
      );
      setMessages(updatedMessages);
    }
  };

  // Marcar mensaje como respondido
  const markAsAnswered = (messageId) => {
    // En un caso real, aquí haría una llamada a la API
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, status: 'answered' } : msg
    );
    setMessages(updatedMessages);
    setIsModalOpen(false);
  };

  // Eliminar mensaje
  const deleteMessage = (messageId) => {
    // En un caso real, aquí haría una llamada a la API
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    setIsModalOpen(false);
  };

  // Componente Modal para ver detalle de mensaje
  const MessageDetailModal = () => {
    const [replyText, setReplyText] = useState('');

    const handleReply = (e) => {
      e.preventDefault();
      // Aquí iría la lógica para enviar la respuesta (API call)
      console.log('Sending reply:', replyText);
      markAsAnswered(selectedMessage.id);
    };

    if (!selectedMessage) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">{selectedMessage.subject}</h2>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-semibold">{selectedMessage.sender}</span>
                <span className="text-gray-500 ml-2">&lt;{selectedMessage.email}&gt;</span>
              </div>
              <div className="text-sm text-gray-500">
                {selectedMessage.date}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="whitespace-pre-line">{selectedMessage.content}</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Responder</h3>
              <form onSubmit={handleReply}>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 mb-3"
                  rows="4"
                  placeholder="Escribe tu respuesta aquí..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                ></textarea>
                <div className="flex justify-between">
                  <button 
                    type="button"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                  >
                    <span className="material-icons-outlined mr-1">delete</span>
                    Eliminar
                  </button>
                  <div className="space-x-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <span className="material-icons-outlined mr-1">send</span>
                      Enviar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Obtener conteo por estado
  const getStatusCount = (status) => {
    return messages.filter(msg => status === 'all' || msg.status === status).length;
  };

  // Función para mostrar el indicador de estado
  const getStatusBadge = (status) => {
    switch(status) {
      case 'unread':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            No leído
          </span>
        );
      case 'read':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Leído
          </span>
        );
      case 'answered':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Respondido
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Gestionar Mensajes
        </h1>
        <p className="text-gray-600">
          Administra las consultas y mensajes de los usuarios
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <span className="material-icons-outlined">search</span>
              </span>
              <input
                type="text"
                placeholder="Buscar por remitente, email o asunto..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'all' 
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todos ({getStatusCount('all')})
            </button>
            <button 
              onClick={() => setFilterStatus('unread')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'unread' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              No leídos ({getStatusCount('unread')})
            </button>
            <button 
              onClick={() => setFilterStatus('read')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'read' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Leídos ({getStatusCount('read')})
            </button>
            <button 
              onClick={() => setFilterStatus('answered')}
              className={`px-3 py-1 rounded-md text-sm ${
                filterStatus === 'answered' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Respondidos ({getStatusCount('answered')})
            </button>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Cargando mensajes...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-6 text-center">
            <span className="material-icons-outlined text-4xl text-gray-400 mb-2">inbox</span>
            <p className="text-gray-600">No hay mensajes que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  message.status === 'unread' ? 'bg-blue-50' : ''
                }`}
                //onClick={() => openMessageDetail(message)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-medium ${message.status === 'unread' ? 'font-bold' : ''}`}>
                    {message.subject}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(message.status)}
                    <span className="text-sm text-gray-500">
                      {message.date.split(' ')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">{message.sender}</span>
                      <span className="text-gray-500 ml-2">&lt;{message.email}&gt;</span>
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {message.content}
                    </p>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-blue-600 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      openMessageDetail(message);
                    }}
                  >
                    <span className="material-icons-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && <MessageDetailModal />}
    </div>
  );
};

export default ManageMessages;