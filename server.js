const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const ejs = require('ejs');
const path = require('path');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;
const db = new Database(path.join(__dirname, 'database.sqlite'));

app.engine('ejs', (filePath, options, callback) => {
  ejs.renderFile(filePath, options, {}, callback);
});
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'curso-unit4-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.message = req.session.message || null;
  delete req.session.message;
  next();
});

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.message = 'Debes iniciar sesión para acceder al contenido.';
    return res.redirect('/login');
  }
  next();
};

const slugify = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const illustrationPool = {
  contenedores: [
    { url: 'https://images.unsplash.com/photo-1542223616-1b0b3f6f9f7c?auto=format&fit=crop&w=900&q=80', alt: 'Infraestructura basada en contenedores' },
    { url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80', alt: 'Arquitectura moderna y despliegue' },
    { url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80', alt: 'Desarrollo de software con tecnología cloud' },
    { url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', alt: 'Equipo trabajando en sistemas distribuidos' }
  ],
  herramientas: [
    { url: 'https://images.unsplash.com/photo-1532619675605-3d8f8c8b0f4f?auto=format&fit=crop&w=900&q=80', alt: 'Herramientas de gestión digital' },
    { url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80', alt: 'Panel de monitorización cloud' },
    { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80', alt: 'Operación de software en la nube' },
    { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80', alt: 'Gestión de plataformas digitales' }
  ],
  infraestructura: [
    { url: 'https://images.unsplash.com/photo-1504691342899-9f1a3d9d1f55?auto=format&fit=crop&w=900&q=80', alt: 'Infraestructura tecnológica escalable' },
    { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80', alt: 'Análisis de rendimiento y red' },
    { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80', alt: 'Sistema de datos y servidores' },
    { url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80', alt: 'Arquitectura de infraestructura' }
  ],
  configuracion: [
    { url: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=900&q=80', alt: 'Configuración de entornos' },
    { url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80', alt: 'Seguridad y certificados digitales' },
    { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80', alt: 'Administración de servicios online' },
    { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80', alt: 'Configuración de infraestructura tecnológica' }
  ],
  pruebas: [
    { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80', alt: 'Análisis y pruebas de software' },
    { url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80', alt: 'Equipo revisando calidad de software' },
    { url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80', alt: 'Validación de aplicaciones' },
    { url: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=900&q=80', alt: 'Procesos de prueba y calidad' }
  ],
  liberacion: [
    { url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80', alt: 'Documentación y liberación de proyectos' },
    { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80', alt: 'Gestión de documentación técnica' },
    { url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', alt: 'Salida de producto y comunicación' },
    { url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80', alt: 'Trabajo conjunto en liberación digital' }
  ]
};

const buildModuleContent = (courseSlug, module, index) => {
  const pool = illustrationPool[courseSlug] || illustrationPool.contenedores;
  const firstImage = pool[(index + 0) % pool.length];
  const secondImage = pool[(index + 2) % pool.length];
  const pointsMarkup = (module.highlights || []).map((point) => `<li>${escapeHtml(point)}</li>`).join('');

  // Generar 5 párrafos informativos con citas básicas (enlaces a documentación oficial)
  const topic = courseSlug || 'general';
  const citations = {
    contenedores: [
      { label: 'Documentación Docker', url: 'https://docs.docker.com/' },
      { label: 'OCI (Open Container Initiative)', url: 'https://opencontainers.org/' },
      { label: 'Kubernetes Concepts', url: 'https://kubernetes.io/docs/concepts/' },
      { label: 'Guía de imágenes seguras', url: 'https://snyk.io/learn/docker-security-best-practices/' },
      { label: 'Buenas prácticas CI/CD', url: 'https://docs.github.com/en/actions' }
    ],
    herramientas: [
      { label: 'Docker', url: 'https://docs.docker.com/' },
      { label: 'AWS', url: 'https://aws.amazon.com/documentation/' },
      { label: 'Azure', url: 'https://learn.microsoft.com/azure/' },
      { label: 'Google Cloud', url: 'https://cloud.google.com/docs' },
      { label: 'Comparativas y guías', url: 'https://www.infoq.com/' }
    ],
    infraestructura: [
      { label: 'Kubernetes', url: 'https://kubernetes.io/docs/' },
      { label: 'High Availability', url: 'https://aws.amazon.com/architecture/high-availability/' },
      { label: 'Monitoring', url: 'https://prometheus.io/docs/introduction/overview/' },
      { label: 'CDN', url: 'https://developer.mozilla.org/en-US/docs/Glossary/CDN' },
      { label: 'Backups', url: 'https://www.redhat.com/en/topics/data-management' }
    ],
    configuracion: [
      { label: 'DNS (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/DNS' },
      { label: 'Let’s Encrypt (certificados)', url: 'https://letsencrypt.org/' },
      { label: 'HTTPS y TLS (OWASP)', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html' },
      { label: 'Gestión de secretos (HashiCorp)', url: 'https://www.vaultproject.io/' },
      { label: 'Buenas prácticas de configuración (Microsoft)', url: 'https://learn.microsoft.com/azure/security/fundamentals/' }
    ],
    pruebas: [
      { label: 'Pruebas unitarias (pytest)', url: 'https://docs.pytest.org/' },
      { label: 'Pruebas de integración (JUnit)', url: 'https://junit.org/junit5/docs/current/user-guide/' },
      { label: 'Automatización y Selenium', url: 'https://www.selenium.dev/documentation/' },
      { label: 'Pruebas de rendimiento (JMeter)', url: 'https://jmeter.apache.org/' },
      { label: 'Calidad y métricas (ISTQB)', url: 'https://www.istqb.org/' }
    ],
    liberacion: [
      { label: 'Control de versiones (Git)', url: 'https://git-scm.com/doc' },
      { label: 'Gestión de releases (Atlassian)', url: 'https://www.atlassian.com/software/jira/guides/release-management' },
      { label: 'Semver', url: 'https://semver.org/' },
      { label: 'Documentación técnica (Read the Docs)', url: 'https://readthedocs.org/' },
      { label: 'Gestión de despliegues (Google SRE)', url: 'https://sre.google/' }
    ],
    general: [
      { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
      { label: 'Stack Overflow', url: 'https://stackoverflow.com/' },
      { label: 'InfoQ', url: 'https://www.infoq.com/' },
      { label: 'GitHub Docs', url: 'https://docs.github.com/' },
      { label: 'OWASP', url: 'https://owasp.org/' }
    ]
  };

  const chosenCitations = citations[topic] || citations.contenedores;

  const paragraphs = [];
  const base = module.detailText || module.summary || '';
  paragraphs.push(escapeHtml(base + ' Este párrafo introduce el módulo y enmarca su utilidad práctica para proyectos de TI.'));
  paragraphs.push(escapeHtml('Aquí aportamos contexto técnico: conceptos, limitaciones y escenarios de uso que ayudan a evaluar decisiones de diseño en entornos productivos.'));
  paragraphs.push(escapeHtml('Se incluyen consideraciones de seguridad y resiliencia para que el estudiante entienda riesgos y medidas de mitigación en la operación real.'));
  paragraphs.push(escapeHtml('Ejemplos de integración con pipelines y herramientas comunes permiten conectar la teoría con prácticas reproducibles en desarrollo y despliegue.'));
  paragraphs.push(escapeHtml('Al final del módulo proponemos referencias y pasos de seguimiento para profundizar en las fuentes oficiales y documentación técnica.'));

  const paragraphsHtml = paragraphs.map((p, i) => `
      <p>${p}</p>
      <p class="citation"><cite><a href="${chosenCitations[i % chosenCitations.length].url}" target="_blank" rel="noopener noreferrer">${escapeHtml(chosenCitations[i % chosenCitations.length].label)}</a></cite></p>
    `).join('');

  const detailedText = module.detailText || `${module.summary} Este contenido conecta la teoría con casos reales de operación, automatización, seguridad y calidad de servicio para que el estudiante pueda aplicar el concepto en proyectos de TI.`;

  return {
    summary: module.summary,
    detailText: detailedText,
    info_html: `
      <div class="module-body">
        <p class="module-summary">${escapeHtml(module.title || module.summary)}</p>
        <div class="module-detail-rich">
          ${paragraphsHtml}
        </div>
        <div class="module-highlights">
          <h4>Conceptos clave</h4>
          <ul class="module-points">${pointsMarkup}</ul>
        </div>
        <div class="module-gallery">
          <img src="${firstImage.url}" alt="${escapeHtml(firstImage.alt)}" class="module-image" loading="lazy" />
          <img src="${secondImage.url}" alt="${escapeHtml(secondImage.alt)}" class="module-image" loading="lazy" />
        </div>
        <p class="module-outcome">${escapeHtml(module.outcome || '')}</p>
      </div>
    `,
    image1: firstImage.url,
    image2: secondImage.url,
    video_url: module.videoUrl
  };
};

const courseSeed = [
  {
    slug: 'contenedores',
    title: 'Contenedores y despliegue',
    description: 'Aprende los fundamentos de los contenedores y su aplicación en ambientes modernos.',
    image: '/images/containers.svg',
    level: 'Básico',
    modules: [
      { title: 'Concepto de contenedores', summary: 'Un contenedor empaqueta una aplicación y sus dependencias para que se ejecute igual en cualquier entorno.', outcome: 'Comprenderás por qué los contenedores aceleran el desarrollo y reducen fallos de compatibilidad.', highlights: ['Aísla dependencias del sistema host', 'Reduce problemas de compatibilidad', 'Facilita la replicación del entorno'], detailText: 'Este módulo introduce los contenedores como una unidad de despliegue ligera que encapsula la aplicación y sus dependencias. En TI, este enfoque permite trabajar con entornos reproducibles, reducir diferencias entre desarrollo y producción y acelerar el tiempo de entrega.', videoUrl: '' },
      { title: 'Imágenes y capas', summary: 'Cada imagen se construye con capas reutilizables que optimizan el tiempo de despliegue.', outcome: 'Reconocerás cómo las capas mejoran la velocidad y el mantenimiento de las imágenes.', highlights: ['Optimiza tiempos de construcción', 'Reutiliza componentes compartidos', 'Mejora trazabilidad del cambio'], detailText: 'La construcción de imágenes con capas permite reutilizar piezas ya validadas y crear despliegues más rápidos y predecibles. En operaciones de TI, este modelo mejora la trazabilidad, la revisión de cambios y la consistencia de los ambientes.', videoUrl: '' },
      { title: 'Evolución del despliegue', summary: 'La virtualización ligera reemplazó muchos procesos manuales con flujos más ágiles.', outcome: 'Entenderás la transición desde máquinas virtuales a entornos ligeros.', highlights: ['Reduce fricción entre equipos', 'Acelera pruebas y producción', 'Simplifica la infraestructura'], detailText: 'Este módulo explica cómo la adopción de contenedores cambió la forma de operar aplicaciones. En la práctica, los equipos de TI pueden entregar nuevas versiones con menos esfuerzo manual, mayor seguridad y menos tiempo de inactividad.', videoUrl: '' },
      { title: 'Portabilidad', summary: 'Los contenedores hacen que la misma aplicación funcione de forma consistente en diferentes equipos.', outcome: 'Identificarás cómo la portabilidad mejora el despliegue entre entornos.', highlights: ['Evita diferencias entre máquinas', 'Reduce incidencias por entorno', 'Mejora la experiencia de desarrollo'], detailText: 'La portabilidad se convierte en un activo clave para equipos que trabajan con múltiples entornos, desde desarrollo hasta producción. En TI, este principio minimiza errores por diferencias de configuración y facilita la colaboración entre áreas.', videoUrl: '' },
      { title: 'Aislamiento y seguridad', summary: 'Cada contenedor funciona con su propio entorno y limita interferencias entre servicios.', outcome: 'Aprenderás a trabajar con menor riesgo y mejor control de dependencias.', highlights: ['Limita interacción entre procesos', 'Reduce riesgos de sobrecarga', 'Mejora separación lógica'], detailText: 'El aislamiento de procesos permite separar componentes y reducir los efectos colaterales de una falla. Este enfoque es relevante para la seguridad, el cumplimiento y la estabilidad de los servicios tecnológicos.', videoUrl: '' },
      { title: 'Trabajo con Docker', summary: 'Docker organiza la construcción, ejecución y publicación de contenedores con un flujo claro.', outcome: 'Dominarás los pasos básicos para crear y operar un contenedor.', highlights: ['Simplifica creación y ejecución', 'Organiza imagenes y contenedores', 'Acelera el intercambio de artefactos'], detailText: 'Docker permite estandarizar la manera en que se crean, ejecutan y comparten aplicaciones. Para los equipos de TI, representa una base prática para implementar pipelines más ágiles y menos propensos a errores humanos.', videoUrl: '' },
      { title: 'Volúmenes y datos', summary: 'Los volúmenes permiten que la información persista más allá del ciclo de vida del contenedor.', outcome: 'Conocerás cómo proteger datos y compartir almacenamiento entre servicios.', highlights: ['Mantiene información persistente', 'Soporta cargas de trabajo reales', 'Evita pérdida tras reinicios'], detailText: 'Los volúmenes son cruciales cuando los servicios deben conservar información o compartirla entre instancias. En TI, este mecanismo mejora la continuidad operativa y reduce la pérdida de datos durante despliegues o reinicios.', videoUrl: '' },
      { title: 'Redes de contenedores', summary: 'Los contenedores pueden comunicarse entre sí mediante redes definidas por el motor.', outcome: 'Entenderás cómo conectar microservicios y aislar tráfico interno.', highlights: ['Conecta componentes de forma segura', 'Facilita comunicación entre servicios', 'Simplifica topologías de prueba'], detailText: 'La red entre contenedores facilita el diseño de arquitecturas distribuidas y servicios conectados. En ambientes empresariales, este conocimiento ayuda a modelar tránsito seguro entre componentes y a mejorar la observabilidad.', videoUrl: '' },
      { title: 'Integración continua', summary: 'Los contenedores facilitan pipelines ágiles y despliegues automatizados.', outcome: 'Identificarás cómo integrar la entrega continua con el desarrollo de software.', highlights: ['Acelera validación de cambios', 'Reduce errores manuales', 'Mejora despliegues repetibles'], detailText: 'La integración continua aprovecha contenedores para validar cambios con mayor rapidez y consistencia. En TI, este enfoque permite reducir errores manuales y publicar nuevas versiones con mayor frecuencia.', videoUrl: '' },
      { title: 'Buenas prácticas', summary: 'Mantener imágenes pequeñas, seguras y reproducibles es esencial para un despliegue profesional.', outcome: 'Aplicarás criterios de calidad para construir contenedores confiables.', highlights: ['Optimiza tamaño final', 'Refuerza seguridad', 'Asegura consistencia en producción'], detailText: 'Las buenas prácticas permiten que los contenedores sean mantenibles, seguros y eficientes en producción. Este módulo orienta a los estudiantes a diseñar soluciones que cumplan con estándares operativos reales.', videoUrl: 'https://www.youtube.com/watch?v=gjRoNFopFig&t=236s' }
    ]
  },
  {
    slug: 'herramientas',
    title: 'Herramientas de gestión',
    description: 'Explora Docker, AWS, Azure y Google Cloud como plataformas de despliegue.',
    image: '/images/cloud.svg',
    level: 'Básico',
    modules: [
      { title: 'Docker como base', summary: 'Docker estandariza la forma de construir, ejecutar y publicar aplicaciones.', outcome: 'Comprenderás por qué Docker se convirtió en un estándar de operación.', highlights: ['Unifica el flujo de trabajo', 'Acelera el despliegue', 'Reduce diferencias entre equipos'], videoUrl: '' },
      { title: 'AWS', summary: 'AWS ofrece servicios de cómputo, red, base de datos y monitoreo para sistemas modernos.', outcome: 'Reconocerás cómo la nube ofrece recursos gestionables y escalables.', highlights: ['Amplía capacidad de infraestructura', 'Agiliza administración de servicios', 'Integra herramientas de monitoreo'], videoUrl: '' },
      { title: 'Azure', summary: 'Azure ofrece herramientas para administrar entornos cloud con integración empresarial.', outcome: 'Entenderás el valor de integrar servicios de Microsoft en entornos productivos.', highlights: ['Optimiza operaciones híbridas', 'Organiza identidades y accesos', 'Facilita administración centralizada'], videoUrl: '' },
      { title: 'Google Cloud', summary: 'Google Cloud proporciona infraestructura escalable para aplicaciones web y APIs.', outcome: 'Conocerás las opciones de infraestructura y servicios inteligentes en la nube.', highlights: ['Apoya cargas de trabajo modernas', 'Ofrece servicios de inteligencia', 'Escala con facilidad'], videoUrl: '' },
      { title: 'Comparación entre plataformas', summary: 'Cada proveedor ofrece ventajas diferenciales según el tipo de carga y la arquitectura.', outcome: 'Serás capaz de elegir una plataforma según costos, requerimientos y equipo.', highlights: ['Compara ventajas y límites', 'Evalúa facilidad de operacion', 'Ajusta decisiones técnicas'], videoUrl: '' },
      { title: 'Gestión de recursos', summary: 'La gestión de recursos permite controlar costos, capacidad y rendimiento.', outcome: 'Aprenderás a monitorear y ajustar recursos de forma responsable.', highlights: ['Optimiza gastos', 'Ajusta capacidad a demanda', 'Mejora estabilidad'], videoUrl: '' },
      { title: 'Seguridad cloud', summary: 'La seguridad en la nube integra cifrado, políticas y control de accesos.', outcome: 'Comprenderás que la seguridad debe formar parte del diseño desde el inicio.', highlights: ['Protege datos sensibles', 'Controla permisos', 'Reduce riesgos de compromisos'], videoUrl: '' },
      { title: 'Escalabilidad', summary: 'La escalabilidad permite responder a cambios de demanda con mayor eficiencia.', outcome: 'Reconocerás cómo preparar sistemas para crecer sin degradar rendimiento.', highlights: ['Responde a picos de tráfico', 'Asegura continuidad', 'Ajusta capacidad en tiempo real'], videoUrl: '' },
      { title: 'Automatización', summary: 'Los pipelines y scripts reducen errores y aceleran el despliegue.', outcome: 'Aplicarás automatización para tener procesos más predecibles.', highlights: ['Reduce intervención manual', 'Disminuye errores', 'Acelera frecuencia de publicación'], videoUrl: '' },
      { title: 'Buenas prácticas de operación', summary: 'Un despliegue bien administrado combina monitoreo, control y documentación.', outcome: 'Dominarás cómo mantener entornos estables y operables.', highlights: ['Documenta procesos', 'Monitorea continuamente', 'Previene incidentes'], videoUrl: 'https://www.youtube.com/watch?v=9eTVZwMZJsA' }
    ]
  },
  {
    slug: 'infraestructura',
    title: 'Infraestructura en la nube',
    description: 'Conoce los servicios de infraestructura que sostienen aplicaciones web modernas.',
    image: '/images/cloud.svg',
    level: 'Intermedio',
    modules: [
      { title: 'Servidor de aplicaciones', summary: 'Un servidor de aplicaciones ejecuta la lógica de negocio y expone servicios.', outcome: 'Comprenderás cómo separar la capa de negocio del acceso de los usuarios.', highlights: ['Gestiona reglas del negocio', 'Expone endpoints funcionales', 'Facilita escalado horizontal'], videoUrl: '' },
      { title: 'Servidor de base de datos', summary: 'La base de datos centraliza información y administra accesos concurrentes.', outcome: 'Conocerás la importancia de estructurar datos de forma segura y eficiente.', highlights: ['Organiza información crítica', 'Optimiza consultas', 'Soporta concurrencia'], videoUrl: '' },
      { title: 'Balanceo de cargas', summary: 'El balanceador de cargas distribuye tráfico para mejorar rendimiento y continuidad.', outcome: 'Aprenderás a evitar cuellos de botella en servicios críticos.', highlights: ['Distribuye peticiones', 'Mejora disponibilidad', 'Equilibra recursos'], videoUrl: '' },
      { title: 'Alta disponibilidad', summary: 'La redundancia evita interrupciones durante fallos parciales del sistema.', outcome: 'Reconocerás cómo diseñar sistemas resilientes para operaciones reales.', highlights: ['Reduce tiempos de caída', 'Protege la continuidad', 'Asegura servicio estable'], videoUrl: '' },
      { title: 'Monitoreo', summary: 'Las métricas permiten detectar fallas antes de que afecten a los usuarios.', outcome: 'Identificarás los indicadores clave para mantener el sistema sano.', highlights: ['Detecta anomalías pronto', 'Mejora respuesta ante incidentes', 'Aumenta confianza operativa'], videoUrl: '' },
      { title: 'Almacenamiento', summary: 'Los servicios de almacenamiento permiten persistir datos y archivos.', outcome: 'Entenderás cómo elegir el tipo de almacenamiento según el caso.', highlights: ['Asegura persistencia', 'Facilita acceso compartido', 'Mejora capacidad de crecimiento'], videoUrl: '' },
      { title: 'Seguridad de red', summary: 'Los grupos de seguridad y reglas de tráfico protegen los servicios expuestos.', outcome: 'Comprenderás cómo controlar el acceso a los recursos con reglas claras.', highlights: ['Protege recursos expuestos', 'Define políticas de entrada', 'Reduce superficies de ataque'], videoUrl: '' },
      { title: 'CDN', summary: 'Una red de distribución mejora la velocidad de entrega para usuarios globales.', outcome: 'Conocerás cómo ubicar contenido más cerca de los clientes.', highlights: ['Reduce latencia', 'Mejora desempeño global', 'Optimiza entrega de recursos'], videoUrl: '' },
      { title: 'Escalado automático', summary: 'El escalado automático ajusta recursos conforme cambia la demanda.', outcome: 'Entenderás cómo responder de forma dinámica a picos de tráfico.', highlights: ['Ajusta capacidad en tiempo real', 'Mejora eficiencia de costos', 'Mantiene experiencia estable'], videoUrl: '' },
      { title: 'Respaldo y recuperación', summary: 'La recuperación ante desastres garantiza continuidad de negocio.', outcome: 'Aprenderás cómo planificar la continuidad en caso de pérdida o interrupción.', highlights: ['Protege información crítica', 'Recupera servicios con rapidez', 'Asegura continuidad'], videoUrl: 'https://www.youtube.com/watch?v=h4Af5bbFAq0&t=174s' }
    ]
  },
  {
    slug: 'configuracion',
    title: 'Configuración de infraestructura',
    description: 'Aprende a configurar dominio, certificados y seguridad para despliegues reales.',
    image: '/images/containers.svg',
    level: 'Intermedio',
    modules: [
      { title: 'Configuración de dominio', summary: 'El dominio facilita que los usuarios accedan al sitio con un nombre reconocible.', outcome: 'Aprenderás a asociar servicios con una identidad digital clara.', highlights: ['Mejora accesibilidad', 'Aumenta confianza de marca', 'Simplifica navegación'], videoUrl: '' },
      { title: 'DNS', summary: 'El sistema DNS traduce nombres de dominio a direcciones de servidor.', outcome: 'Entenderás el rol central del DNS en la infraestructura web.', highlights: ['Convierte nombres a IP', 'Asegura conexión correcta', 'Soporta red distribuida'], videoUrl: '' },
      { title: 'Certificados SSL', summary: 'Los certificados cifran el tráfico y validan la identidad del sitio.', outcome: 'Conocerás la importancia de HTTPS en entornos seguros.', highlights: ['Protege información en tránsito', 'Valida identidad', 'Aumenta confianza del usuario'], videoUrl: '' },
      { title: 'HTTPS', summary: 'HTTPS protege la comunicación entre el navegador y el servidor.', outcome: 'Reconocerás la diferencia entre tráfico abierto y tráfico cifrado.', highlights: ['Evita interceptaciones', 'Mejora integridad de datos', 'Asegura transporte seguro'], videoUrl: '' },
      { title: 'Firewall', summary: 'Un firewall controla el tráfico de entrada y salida según reglas.', outcome: 'Aprenderás a filtrar accesos y minimizar amenazas.', highlights: ['Limita tráfico indeseado', 'Protege servicios expuestos', 'Organiza reglas de acceso'], videoUrl: '' },
      { title: 'Variables de entorno', summary: 'Las variables de entorno separan configuraciones sensibles del código.', outcome: 'Comprenderás cómo externalizar secretos y ajustes de entorno.', highlights: ['Reduce hardcoding', 'Mejora seguridad', 'Ajusta configuración por entorno'], videoUrl: '' },
      { title: 'Secretos', summary: 'Los secretos deben almacenarse y rotarse de forma segura.', outcome: 'Aprenderás cómo proteger claves y credenciales críticas.', highlights: ['Evita exposición accidental', 'Mejora control de acceso', 'Asegura rotación de credenciales'], videoUrl: '' },
      { title: 'Logs y auditoría', summary: 'La auditoría permite rastrear cambios y resolver incidentes.', outcome: 'Conocerás cómo volver trazables las operaciones del sistema.', highlights: ['Registra eventos clave', 'Facilita diagnósticos', 'Soporta cumplimiento'], videoUrl: '' },
      { title: 'Monitoreo de seguridad', summary: 'Los sistemas de monitoreo detectan accesos sospechosos y fallos operativos.', outcome: 'Identificarás cómo reaccionar más rápido ante amenazas.', highlights: ['Detecta actividad anómala', 'Aumenta visibilidad', 'Mejora tiempos de respuesta'], videoUrl: '' },
      { title: 'Buenas prácticas de despliegue', summary: 'Una infraestructura bien configurada reduce riesgos y mejora confiabilidad.', outcome: 'Aplicarás criterios de operación profesional en tus despliegues.', highlights: ['Reduce riesgos', 'Asegura estabilidad', 'Mejora continuidad'], videoUrl: 'https://www.youtube.com/watch?v=eyLXH2wV0RM' }
    ]
  },
  {
    slug: 'pruebas',
    title: 'Pruebas de software',
    description: 'Comprende los tipos de pruebas que garantizan calidad y estabilidad.',
    image: '/images/testing.svg',
    level: 'Avanzado',
    modules: [
      { title: 'Caja blanca', summary: 'La caja blanca revisa la estructura interna y la lógica del software.', outcome: 'Comprenderás cómo validar el comportamiento del código desde dentro.', highlights: ['Revisa lógica interna', 'Detecta errores de implementación', 'Apoya refactorización'], videoUrl: '' },
      { title: 'Caja negra', summary: 'La caja negra evalúa comportamiento esperado desde el punto de vista del usuario.', outcome: 'Identificarás cómo probar funciones sin conocer el detalle interno.', highlights: ['Evalúa experiencia de usuario', 'Prueba comportamiento observable', 'Reduce sesgos técnicos'], videoUrl: '' },
      { title: 'Pruebas unitarias', summary: 'Las pruebas unitarias validan módulos aislados antes de integrarlos.', outcome: 'Aprenderás a encontrar fallos en piezas pequeñas desde el inicio.', highlights: ['Aísla componentes', 'Rápidas de ejecutar', 'Mejoran diseño'], videoUrl: '' },
      { title: 'Pruebas de integración', summary: 'La integración verifica que los módulos trabajen correctamente juntos.', outcome: 'Comprenderás la importancia de validar flujos completos.', highlights: ['Prueba interacción entre piezas', 'Detecta fallos de interfaz', 'Mejora estabilidad'], videoUrl: '' },
      { title: 'Pruebas de regresión', summary: 'Las regresiones aseguran que cambios recientes no rompan funciones ya existentes.', outcome: 'Conocerás cómo proteger funcionalidades validadas de cambios futuros.', highlights: ['Evita pérdidas inesperadas', 'Asegura continuidad', 'Protege entregas'], videoUrl: '' },
      { title: 'Pruebas de rendimiento', summary: 'El rendimiento mide velocidad, capacidad y estabilidad bajo carga.', outcome: 'Aprenderás a medir la calidad operativa del sistema.', highlights: ['Evalúa tiempos de respuesta', 'Detecta cuellos de botella', 'Mejora experiencia del usuario'], videoUrl: '' },
      { title: 'Pruebas de esfuerzo', summary: 'Las pruebas de esfuerzo analizan el comportamiento en límites de capacidad.', outcome: 'Reconocerás cómo preparar sistemas para picos reales de uso.', highlights: ['Prueba límites del sistema', 'Evalúa estabilidad bajo presión', 'Previene fallas mayores'], videoUrl: '' },
      { title: 'Pruebas de usabilidad', summary: 'Las pruebas de usabilidad evalúan la experiencia del usuario final.', outcome: 'Identificarás cómo mejorar la interacción y la comprensión.', highlights: ['Evalúa claridad del flujo', 'Mejora satisfacción', 'Reduce fricción'], videoUrl: '' },
      { title: 'Automatización de pruebas', summary: 'La automatización acelera ejecuciones repetitivas y mejora cobertura.', outcome: 'Comprenderás cómo integrar pruebas en ciclos rápidos de entrega.', highlights: ['Aumenta cobertura', 'Disminuye tiempos manuales', 'Mejora repetibilidad'], videoUrl: '' },
      { title: 'Métricas de calidad', summary: 'Los indicadores ayudan a priorizar mejoras y medir el avance del proyecto.', outcome: 'Aprenderás a transformar datos de prueba en decisiones concretas.', highlights: ['Cuantifica resultados', 'Aporta evidencia', 'Mejora priorización'], videoUrl: 'https://www.youtube.com/watch?v=hSxXuRxA9mo' }
    ]
  },
  {
    slug: 'liberacion',
    title: 'Liberación y documentación',
    description: 'Conecta calidad, normatividad y documentación para una liberación responsable.',
    image: '/images/docs.svg',
    level: 'Avanzado',
    modules: [
      { title: 'Políticas de liberación', summary: 'Las políticas establecen criterios claros para publicar software con confianza.', outcome: 'Comprenderás cómo definir reglas de publicación y control de calidad.', highlights: ['Establece condiciones claras', 'Reduce riesgos', 'Guía decisiones de negocio'], videoUrl: '' },
      { title: 'Normativa aplicable', summary: 'La normativa guía el cumplimiento legal, de seguridad y trazabilidad.', outcome: 'Reconocerás la importancia del cumplimiento en cada liberación.', highlights: ['Alinea procesos con la ley', 'Mejora trazabilidad', 'Protege la organización'], videoUrl: '' },
      { title: 'Control de versiones', summary: 'El control de versiones registra cambios y facilita la colaboración.', outcome: 'Aprenderás a administrar entregas con mayor control y visibilidad.', highlights: ['Registra evolución del producto', 'Facilita colaboración', 'Evita pérdidas de historial'], videoUrl: '' },
      { title: 'Plan de despliegue', summary: 'El plan de despliegue organiza las tareas, riesgos y validaciones.', outcome: 'Conocerás cómo preparar una liberación de forma ordenada.', highlights: ['Coordina actividades', 'Reduce errores operativos', 'Mejora tiempos de salida'], videoUrl: '' },
      { title: 'Documentación técnica', summary: 'La documentación técnica mantiene el conocimiento del sistema disponible.', outcome: 'Comprenderás cómo preservar la memoria del proyecto para el equipo.', highlights: ['Guarda conocimiento', 'Facilita mantenimiento', 'Reduce dependencia individual'], videoUrl: '' },
      { title: 'Manual de usuario', summary: 'El manual orienta al usuario sobre uso correcto y buenas prácticas.', outcome: 'Aprenderás a acompañar la adopción con información útil y clara.', highlights: ['Mejora autogestión del usuario', 'Reduce soporte repetitivo', 'Aumenta satisfacción'], videoUrl: '' },
      { title: 'Soporte y mantenimiento', summary: 'Mantenimiento y soporte garantizan continuidad después del lanzamiento.', outcome: 'Reconocerás el valor del soporte continuo en los productos.', highlights: ['Responde a incidentes', 'Mantiene estabilidad', 'Mejora confianza del cliente'], videoUrl: '' },
      { title: 'Retroalimentación', summary: 'La retroalimentación de usuarios ayuda a mejorar futuras versiones.', outcome: 'Comprenderás cómo convertir comentarios en mejoras concretas.', highlights: ['Prioriza mejoras reales', 'Mejora producto', 'Aumenta valor percibido'], videoUrl: '' },
      { title: 'Trazabilidad', summary: 'Trazar cambios facilita auditorías y resolución de incidentes.', outcome: 'Conocerás cómo mantener evidencias de cada decisión y cambio.', highlights: ['Aporta contexto del cambio', 'Acelera auditorías', 'Simplifica resolución de fallos'], videoUrl: '' },
      { title: 'Liberación final', summary: 'La liberación final combina validación, documentación y comunicación.', outcome: 'Aplicarás un enfoque completo para cerrar un proyecto con calidad.', highlights: ['Unifica validación y comunicación', 'Reduce riesgos finales', 'Mejora aceptación del producto'], videoUrl: 'https://www.youtube.com/watch?v=eVfpTD1ieIw' }
    ]
  }
];

const quizBank = {
  1: [
    { prompt: '¿Qué caracteriza mejor a un contenedor?', options: ['Aislado con dependencias y kernel compartido', 'Un sistema operativo completo', 'Un dispositivo de hardware'], answer: 'Aislado con dependencias y kernel compartido' },
    { prompt: '¿Cuál es la ventaja principal de Docker?', options: ['Portabilidad y despliegue consistente', 'Elimina las redes', 'No requiere dependencias'], answer: 'Portabilidad y despliegue consistente' },
    { prompt: '¿Qué se empaqueta normalmente en una imagen?', options: ['Aplicación y dependencias', 'Solo documentos', 'Solo cables'], answer: 'Aplicación y dependencias' },
    { prompt: '¿Qué permite un volumen?', options: ['Persistir datos', 'Reducir RAM', 'Eliminar seguridad'], answer: 'Persistir datos' },
    { prompt: '¿Qué facilita la integración continua?', options: ['Contenedores reproducibles', 'Teclados externos', 'Más cables'], answer: 'Contenedores reproducibles' },
    { prompt: '¿Qué permite la red de contenedores?', options: ['Comunicación entre servicios', 'Cambiar el CPU', 'Borrar logs'], answer: 'Comunicación entre servicios' },
    { prompt: '¿Cuál es una práctica recomendada?', options: ['Mantener imágenes pequeñas', 'Usar solo un archivo', 'Evitar monitoreo'], answer: 'Mantener imágenes pequeñas' },
    { prompt: '¿Qué ventaja aporta el aislamiento?', options: ['Menos interferencia entre aplicaciones', 'Más latencia', 'Menos seguridad'], answer: 'Menos interferencia entre aplicaciones' },
    { prompt: '¿Qué define la portabilidad?', options: ['Ejecutar igual en distintos entornos', 'Cambiar de sistema operativo', 'Reducir usuarios'], answer: 'Ejecutar igual en distintos entornos' },
    { prompt: '¿Qué mejora la modularidad del despliegue?', options: ['Separar componentes y dependencias', 'Unificar todo en una sola capa', 'Eliminar imágenes'], answer: 'Separar componentes y dependencias' }
  ],
  2: [
    { prompt: '¿Qué herramienta se asocia al uso de contenedores?', options: ['Docker', 'Excel', 'Photoshop'], answer: 'Docker' },
    { prompt: '¿Qué plataforma ofrece servicios de nube?', options: ['AWS', 'Notepad', 'Windows Media Player'], answer: 'AWS' },
    { prompt: '¿Qué plataforma pertenece a Microsoft?', options: ['Azure', 'Google Docs', 'Slack'], answer: 'Azure' },
    { prompt: '¿Qué proveedor ofrece Google Cloud?', options: ['Google', 'IBM', 'Oracle'], answer: 'Google' },
    { prompt: '¿Qué es clave en la gestión de recursos?', options: ['Controlar costos y capacidad', 'Eliminar seguridad', 'Cambiar color'], answer: 'Controlar costos y capacidad' },
    { prompt: '¿Qué mejora la escalabilidad?', options: ['Agregar recursos dinámicamente', 'Reducir procesos', 'Borrar logs'], answer: 'Agregar recursos dinámicamente' },
    { prompt: '¿Qué requiere un entorno seguro?', options: ['Políticas y control de accesos', 'Mayor cantidad de ventanas', 'Más iconos'], answer: 'Políticas y control de accesos' },
    { prompt: '¿Qué facilita la automatización?', options: ['Pipelines y scripts', 'Teclados', 'Monitores'], answer: 'Pipelines y scripts' },
    { prompt: '¿Qué es importante en la operación?', options: ['Monitoreo constante', 'Sin documentación', 'Sin respaldos'], answer: 'Monitoreo constante' },
    { prompt: '¿Qué busca la comparación entre plataformas?', options: ['Elegir la opción más conveniente', 'Cambiar el idioma', 'Eliminar los servicios'], answer: 'Elegir la opción más conveniente' }
  ],
  3: [
    { prompt: '¿Qué servicio ejecuta la lógica de negocio?', options: ['Servidor de aplicaciones', 'Servidor físico', 'Router'], answer: 'Servidor de aplicaciones' },
    { prompt: '¿Qué componente persiste datos?', options: ['Servidor de base de datos', 'Monitor', 'CPU'], answer: 'Servidor de base de datos' },
    { prompt: '¿Qué distribuye tráfico?', options: ['Balanceador de cargas', 'Teclado', 'Mouse'], answer: 'Balanceador de cargas' },
    { prompt: '¿Qué mejora la continuidad del sistema?', options: ['Alta disponibilidad', 'Menos memoria', 'Más cables'], answer: 'Alta disponibilidad' },
    { prompt: '¿Qué permite detectar fallas?', options: ['Monitoreo', 'Modo avión', 'Borrar archivos'], answer: 'Monitoreo' },
    { prompt: '¿Qué ayuda a entregar contenido más rápido?', options: ['CDN', 'Impresora', 'USB'], answer: 'CDN' },
    { prompt: '¿Qué ajusta recursos según la carga?', options: ['Escalado automático', 'Apagado manual', 'Cambio de teclado'], answer: 'Escalado automático' },
    { prompt: '¿Qué protege los servicios expuestos?', options: ['Seguridad de red', 'Pantalla', 'Router simple'], answer: 'Seguridad de red' },
    { prompt: '¿Qué permite recuperación ante desastres?', options: ['Respaldo y recuperación', 'Un nuevo sistema operativo', 'Más ventiladores'], answer: 'Respaldo y recuperación' },
    { prompt: '¿Qué es clave para el rendimiento?', options: ['Diseño adecuado de infraestructura', 'Un color distinto', 'Más iconos'], answer: 'Diseño adecuado de infraestructura' }
  ],
  4: [
    { prompt: '¿Qué facilita un dominio?', options: ['Acceso por nombre reconocible', 'Más CPU', 'Más pantallas'], answer: 'Acceso por nombre reconocible' },
    { prompt: '¿Qué traduce nombres de dominio?', options: ['DNS', 'BIOS', 'Navegador'], answer: 'DNS' },
    { prompt: '¿Qué habilita HTTPS?', options: ['Certificados SSL', 'Cable USB', 'Teclados'], answer: 'Certificados SSL' },
    { prompt: '¿Qué protege la comunicación del navegador?', options: ['HTTPS', 'Bluetooth', 'WiFi'], answer: 'HTTPS' },
    { prompt: '¿Qué controla el tráfico de red?', options: ['Firewall', 'Monitor', 'Disco duro'], answer: 'Firewall' },
    { prompt: '¿Qué separa configuraciones sensibles?', options: ['Variables de entorno', 'El escritorio', 'El mouse'], answer: 'Variables de entorno' },
    { prompt: '¿Qué debe almacenarse de forma segura?', options: ['Secretos', 'Imágenes', 'Videos de prueba'], answer: 'Secretos' },
    { prompt: '¿Qué ayuda a rastrear cambios?', options: ['Logs y auditoría', 'Menos memoria', 'Más carpetas'], answer: 'Logs y auditoría' },
    { prompt: '¿Qué detecta accesos sospechosos?', options: ['Monitoreo de seguridad', 'Sistema operativo', 'Copias de seguridad'], answer: 'Monitoreo de seguridad' },
    { prompt: '¿Qué reduce riesgos operativos?', options: ['Buenas prácticas de despliegue', 'Más colores', 'Más botones'], answer: 'Buenas prácticas de despliegue' }
  ],
  5: [
    { prompt: '¿Qué evalúa la caja blanca?', options: ['Estructura interna y lógica', 'Solo diseño visual', 'Solo colores'], answer: 'Estructura interna y lógica' },
    { prompt: '¿Qué evalúa la caja negra?', options: ['Comportamiento esperado', 'Solo código interno', 'Solo documentos'], answer: 'Comportamiento esperado' },
    { prompt: '¿Qué prueban las unitarias?', options: ['Módulos aislados', 'Todo el sistema de inmediato', 'Solo el teclado'], answer: 'Módulos aislados' },
    { prompt: '¿Qué verifican las pruebas de integración?', options: ['Interacción entre módulos', 'Solo una pantalla', 'Solo impresoras'], answer: 'Interacción entre módulos' },
    { prompt: '¿Qué busca una regresión?', options: ['Evitar romper funciones previas', 'Cambiar la base de datos', 'Eliminar test cases'], answer: 'Evitar romper funciones previas' },
    { prompt: '¿Qué mide una prueba de rendimiento?', options: ['Velocidad y estabilidad', 'Color del logo', 'Tamaño de fuente'], answer: 'Velocidad y estabilidad' },
    { prompt: '¿Qué analizan las pruebas de esfuerzo?', options: ['Límites de capacidad', 'Solo pantallas', 'Solo nombres de usuarios'], answer: 'Límites de capacidad' },
    { prompt: '¿Qué evalúa la usabilidad?', options: ['Experiencia del usuario final', 'Solo la base de datos', 'Solo la red'], answer: 'Experiencia del usuario final' },
    { prompt: '¿Qué mejora la automatización?', options: ['Cobertura y velocidad', 'Menos calidad', 'Más errores'], answer: 'Cobertura y velocidad' },
    { prompt: '¿Qué ayudan las métricas de calidad?', options: ['Priorizar mejoras', 'Ocultar fallos', 'Eliminar documentación'], answer: 'Priorizar mejoras' }
  ],
  6: [
    { prompt: '¿Qué establecen las políticas de liberación?', options: ['Criterios para publicar', 'Solo colores de interfaz', 'Solo permisos de usuario'], answer: 'Criterios para publicar' },
    { prompt: '¿Qué guía la normativa aplicable?', options: ['Cumplimiento legal y seguridad', 'Solo diseño visual', 'Solo productos'], answer: 'Cumplimiento legal y seguridad' },
    { prompt: '¿Qué facilita el control de versiones?', options: ['Gestionar cambios', 'Cambiar hardware', 'Eliminar logs'], answer: 'Gestionar cambios' },
    { prompt: '¿Qué organiza un plan de despliegue?', options: ['Tareas, riesgos y validaciones', 'Solo un formulario', 'Solo un manual'], answer: 'Tareas, riesgos y validaciones' },
    { prompt: '¿Qué mantiene disponible el conocimiento técnico?', options: ['Documentación técnica', 'Solo iconos', 'Solo CSS'], answer: 'Documentación técnica' },
    { prompt: '¿Qué orienta al usuario final?', options: ['Manual de usuario', 'Serverless', 'Base de datos'], answer: 'Manual de usuario' },
    { prompt: '¿Qué garantiza continuidad posterior al lanzamiento?', options: ['Soporte y mantenimiento', 'Más videos', 'Más módulos'], answer: 'Soporte y mantenimiento' },
    { prompt: '¿Qué mejora futuras versiones?', options: ['Retroalimentación de usuarios', 'Cambiar colores', 'Eliminar pruebas'], answer: 'Retroalimentación de usuarios' },
    { prompt: '¿Qué facilita auditorías?', options: ['Trazabilidad', 'Borrar archivos', 'Cambiar el logo'], answer: 'Trazabilidad' },
    { prompt: '¿Qué combina la liberación final?', options: ['Validación, documentación y comunicación', 'Solo código', 'Solo imágenes'], answer: 'Validación, documentación y comunicación' }
  ]
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    course_order INTEGER NOT NULL,
    level TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT NOT NULL,
    theme_order INTEGER NOT NULL,
    summary TEXT,
    info_html TEXT,
    image1 TEXT,
    image2 TEXT
  );

  CREATE TABLE IF NOT EXISTS user_theme_progress (
    user_id INTEGER NOT NULL,
    theme_id INTEGER NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, theme_id)
  );

  CREATE TABLE IF NOT EXISTS user_course_progress (
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
  );
`);

const ensureThemeColumns = () => {
  const columnsToAdd = [
    ['content', 'TEXT'],
    ['video_url', 'TEXT'],
    ['theme_order', 'INTEGER'],
    ['summary', 'TEXT'],
    ['info_html', 'TEXT'],
    ['image1', 'TEXT'],
    ['image2', 'TEXT']
  ];

  columnsToAdd.forEach(([columnName, columnType]) => {
    try {
      db.exec(`ALTER TABLE themes ADD COLUMN ${columnName} ${columnType}`);
    } catch (error) {
      // Las columnas ya existen en bases previas.
    }
  });
};

const ensureUserColumns = () => {
  try {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
  } catch (error) {
    // La columna ya existe en bases previas.
  }
  try {
    db.prepare("UPDATE users SET role = 'admin' WHERE role IS NULL OR role = ''").run();
  } catch (error) {
    // Ignorar si la tabla aún no tiene registros.
  }
};

ensureThemeColumns();
ensureUserColumns();

const seedData = () => {
  const insertCourse = db.prepare(`INSERT INTO courses (slug, title, description, image, course_order, level) VALUES (?, ?, ?, ?, ?, ?)`);
  const updateCourse = db.prepare(`UPDATE courses SET title = ?, description = ?, image = ?, course_order = ?, level = ? WHERE slug = ?`);
  const insertTheme = db.prepare(`INSERT INTO themes (course_id, title, content, video_url, theme_order, summary, info_html, image1, image2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const updateTheme = db.prepare(`UPDATE themes SET title = ?, content = ?, video_url = ?, summary = ?, info_html = ?, image1 = ?, image2 = ? WHERE course_id = ? AND theme_order = ?`);
  const getExistingTheme = db.prepare('SELECT id FROM themes WHERE course_id = ? AND theme_order = ?');

  courseSeed.forEach((course, index) => {
    const existingCourse = db.prepare('SELECT id FROM courses WHERE slug = ?').get(course.slug);
    if (existingCourse) {
      updateCourse.run(course.title, course.description, course.image, index + 1, course.level, course.slug);
    } else {
      insertCourse.run(course.slug, course.title, course.description, course.image, index + 1, course.level);
    }

    const courseRecord = db.prepare('SELECT id FROM courses WHERE slug = ?').get(course.slug);
    course.modules.forEach((module, moduleIndex) => {
      const builtModule = buildModuleContent(course.slug, module, moduleIndex);
      const existingTheme = getExistingTheme.get(courseRecord.id, moduleIndex + 1);
      if (existingTheme) {
        updateTheme.run(module.title, builtModule.summary, builtModule.video_url, builtModule.summary, builtModule.info_html, builtModule.image1, builtModule.image2, courseRecord.id, moduleIndex + 1);
      } else {
        insertTheme.run(courseRecord.id, module.title, builtModule.summary, builtModule.video_url, moduleIndex + 1, builtModule.summary, builtModule.info_html, builtModule.image1, builtModule.image2);
      }
    });
  });
};

seedData();

const getAllCourses = () => db.prepare('SELECT * FROM courses ORDER BY course_order').all();
const getCourseById = (courseId) => db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
const getCourseBySlug = (slug) => db.prepare('SELECT * FROM courses WHERE slug = ?').get(slug);
const getThemesForCourse = (courseId) => db.prepare('SELECT id, course_id, title, content, video_url, theme_order, summary, info_html, image1, image2 FROM themes WHERE course_id = ? ORDER BY theme_order').all(courseId);
const getThemeById = (themeId) => db.prepare('SELECT id, course_id, title, content, video_url, theme_order, summary, info_html, image1, image2 FROM themes WHERE id = ?').get(themeId);
const getUserCourseProgress = (userId, courseId) => db.prepare('SELECT * FROM user_course_progress WHERE user_id = ? AND course_id = ?').get(userId, courseId);
const getViewedThemesCount = (userId, courseId) => {
  const themes = getThemesForCourse(courseId);
  if (!themes.length) return 0;
  const ids = themes.map((theme) => theme.id);
  const placeholders = ids.map(() => '?').join(',');
  const row = db.prepare(`SELECT COUNT(*) as count FROM user_theme_progress WHERE user_id = ? AND theme_id IN (${placeholders})`).get(userId, ...ids);
  return row.count;
};
const getCourseAccess = (userId, courseId) => {
  const course = getCourseById(courseId);
  if (!course) return { allowed: false, reason: 'Curso no encontrado' };
  const userRole = db.prepare('SELECT role FROM users WHERE id = ?').get(userId)?.role;
  if (userRole === 'admin') return { allowed: true, reason: 'Administrador' };
  if (course.course_order === 1) return { allowed: true, reason: 'Primer curso' };
  const previousCourse = db.prepare('SELECT * FROM courses WHERE course_order = ?').get(course.course_order - 1);
  if (!previousCourse) return { allowed: false, reason: 'Curso no disponible' };
  const previousProgress = getUserCourseProgress(userId, previousCourse.id);
  if (!previousProgress || previousProgress.completed !== 1 || previousProgress.score < 70) {
    return { allowed: false, reason: 'Debes aprobar el curso anterior con al menos 70 puntos' };
  }
  return { allowed: true, reason: 'Acceso habilitado' };
};

app.get('/', (req, res) => {
  res.render('home', { title: 'Inicio' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Registro' });
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    req.session.message = 'Completa todos los campos.';
    return res.redirect('/register');
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    req.session.message = 'Ese correo ya está registrado.';
    return res.redirect('/register');
  }

  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name.trim(), email.toLowerCase(), hashed, 'student');
  req.session.message = 'Registro exitoso. Inicia sesión para continuar.';
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Iniciar sesión' });
});

app.post('/login', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email.toLowerCase());
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    req.session.message = 'Credenciales inválidas.';
    return res.redirect('/login');
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role || 'student' };
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/dashboard', requireAuth, (req, res) => {
  const courses = getAllCourses();
  const enriched = courses.map((course) => {
    const progress = getUserCourseProgress(req.session.user.id, course.id);
    const viewedThemes = getViewedThemesCount(req.session.user.id, course.id);
    const totalThemes = getThemesForCourse(course.id).length;
    const progressPercent = totalThemes ? Math.round((viewedThemes / totalThemes) * 100) : 0;
    const access = getCourseAccess(req.session.user.id, course.id);
    return {
      ...course,
      progress,
      viewedThemes,
      totalThemes,
      progressPercent,
      access,
      locked: !access.allowed
    };
  });

  res.render('dashboard', { title: 'Panel de cursos', courses: enriched });
});

app.get('/courses/:courseId', requireAuth, (req, res) => {
  const course = getCourseById(parseInt(req.params.courseId, 10));
  if (!course) return res.status(404).send('Curso no encontrado');

  const access = getCourseAccess(req.session.user.id, course.id);
  if (!access.allowed) {
    req.session.message = access.reason;
    return res.redirect('/dashboard');
  }

  const themes = getThemesForCourse(course.id);
  const progress = getUserCourseProgress(req.session.user.id, course.id);
  const viewedThemes = getViewedThemesCount(req.session.user.id, course.id);
  const progressPercent = themes.length ? Math.round((viewedThemes / themes.length) * 100) : 0;
  const allViewed = viewedThemes >= themes.length || req.session.user.role === 'admin';

  res.render('course', { title: course.title, course, themes, progress, progressPercent, viewedThemes, totalThemes: themes.length, allViewed });
});

const getYouTubeVideoInfo = (videoUrl) => {
  const videoIdMatch = (videoUrl || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  if (!videoIdMatch) {
    return Promise.resolve(null);
  }

  const videoId = videoIdMatch[1];
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  return new Promise((resolve) => {
    https.get(oembedUrl, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            title: parsed.title || 'Video explicativo del curso',
            thumbnailUrl: parsed.thumbnail_url || '',
            embedUrl: `https://www.youtube.com/embed/${videoId}`
          });
        } catch (error) {
          resolve({ title: 'Video explicativo del curso', thumbnailUrl: '', embedUrl: `https://www.youtube.com/embed/${videoId}` });
        }
      });
    }).on('error', () => {
      resolve({ title: 'Video explicativo del curso', thumbnailUrl: '', embedUrl: `https://www.youtube.com/embed/${videoId}` });
    });
  });
};

app.get('/themes/:themeId', requireAuth, async (req, res) => {
  const theme = getThemeById(parseInt(req.params.themeId, 10));
  if (!theme) return res.status(404).send('Tema no encontrado');

  const course = getCourseById(theme.course_id);
  const themes = getThemesForCourse(course.id);
  const index = themes.findIndex((item) => item.id === theme.id);
  const previousTheme = index > 0 ? themes[index - 1] : null;
  const nextTheme = index < themes.length - 1 ? themes[index + 1] : null;
  const totalThemes = themes.length;
  const viewedThemesBefore = getViewedThemesCount(req.session.user.id, course.id);
  const insertResult = db.prepare('INSERT OR IGNORE INTO user_theme_progress (user_id, theme_id) VALUES (?, ?)').run(req.session.user.id, theme.id);
  const viewedThemesAfter = getViewedThemesCount(req.session.user.id, course.id);
  const progressAfterPercent = totalThemes ? Math.round((viewedThemesAfter / totalThemes) * 100) : 0;
  const showCourseVideo = index === themes.length - 2;
  const videoInfo = await getYouTubeVideoInfo(theme.video_url);

  res.render('theme', {
    title: theme.title,
    course,
    theme,
    previousTheme,
    nextTheme,
    currentThemeIndex: index + 1,
    totalThemes,
    videoInfo,
    videoEmbedUrl: videoInfo?.embedUrl || theme.video_url,
    showCourseVideo,
    progressAfterPercent
  });
});

app.get('/courses/:courseId/quiz', requireAuth, (req, res) => {
  const course = getCourseById(parseInt(req.params.courseId, 10));
  if (!course) return res.status(404).send('Curso no encontrado');

  const themes = getThemesForCourse(course.id);
  const viewedThemes = getViewedThemesCount(req.session.user.id, course.id);
  if (req.session.user.role !== 'admin' && viewedThemes < themes.length) {
    req.session.message = 'Debes ver todos los módulos antes de desbloquear el examen.';
    return res.redirect(`/courses/${course.id}`);
  }

  const questions = quizBank[course.id] || [];
  res.render('quiz', { title: `Evaluación de ${course.title}`, course, questions, result: null, modalOpen: false });
});

app.post('/courses/:courseId/quiz', requireAuth, (req, res) => {
  const course = getCourseById(parseInt(req.params.courseId, 10));
  if (!course) return res.status(404).send('Curso no encontrado');

  const questions = quizBank[course.id] || [];
  let correct = 0;
  questions.forEach((question, index) => {
    const selected = req.body[`q${index}`];
    if (selected === question.answer) correct += 1;
  });

  const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const attempts = (getUserCourseProgress(req.session.user.id, course.id)?.attempts || 0) + 1;
  db.prepare(`
    INSERT INTO user_course_progress (user_id, course_id, score, attempts, completed, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, course_id) DO UPDATE SET
      score = excluded.score,
      attempts = excluded.attempts,
      completed = excluded.completed,
      updated_at = CURRENT_TIMESTAMP
  `).run(req.session.user.id, course.id, score, attempts, score >= 70 ? 1 : 0);

  const nextCourse = db.prepare('SELECT * FROM courses WHERE course_order = ?').get(course.course_order + 1);
  const result = { score, correct, total: questions.length, passed: score >= 70, nextCourse };
  res.render('quiz', { title: `Evaluación de ${course.title}`, course, questions, result, modalOpen: true });
});

app.get('/admin/courses/new', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    req.session.message = 'Solo los administradores pueden crear cursos.';
    return res.redirect('/dashboard');
  }

  res.render('add_course', { title: 'Agregar curso' });
});

app.post('/admin/courses', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    req.session.message = 'Solo los administradores pueden crear cursos.';
    return res.redirect('/dashboard');
  }

  const title = (req.body.title || '').trim();
  const description = (req.body.description || '').trim();
  const level = (req.body.level || 'Básico').trim();
  const image = (req.body.image || '/images/cloud.svg').trim();
  const providedSlug = (req.body.slug || '').trim();
  const slug = slugify(providedSlug || title);

  if (!title || !description) {
    req.session.message = 'Completa el título y la descripción del curso.';
    return res.redirect('/admin/courses/new');
  }

  const existing = db.prepare('SELECT id FROM courses WHERE slug = ?').get(slug);
  if (existing) {
    req.session.message = 'Ya existe un curso con ese identificador.';
    return res.redirect('/admin/courses/new');
  }

  const nextOrder = (db.prepare('SELECT MAX(course_order) AS maxOrder FROM courses').get()?.maxOrder || 0) + 1;
  db.prepare('INSERT INTO courses (slug, title, description, image, course_order, level) VALUES (?, ?, ?, ?, ?, ?)')
    .run(slug, title, description, image, nextOrder, level);

  const courseRecord = db.prepare('SELECT id FROM courses WHERE slug = ?').get(slug);
  const defaultModule = {
    title: 'Módulo introductorio',
    summary: 'Este curso incluye un módulo inicial para orientar al estudiante en los fundamentos del tema.',
    outcome: 'El estudiante podrá identificar el propósito general del curso y comenzar a estudiar con contexto.',
    highlights: ['Introduce el objetivo del curso', 'Explica la estructura general', 'Guía los primeros pasos de aprendizaje'],
    detailText: 'Este módulo introductorio ayuda a estructurar la experiencia de aprendizaje con contenidos claros, referencias y una primera guía sobre el alcance del curso.',
    videoUrl: 'https://www.youtube.com/watch?v=gjRoNFopFig&t=236s'
  };
  const builtModule = buildModuleContent(slug, defaultModule, 0);
  db.prepare('INSERT INTO themes (course_id, title, content, video_url, theme_order, summary, info_html, image1, image2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(courseRecord.id, defaultModule.title, builtModule.summary, builtModule.video_url, 1, builtModule.summary, builtModule.info_html, builtModule.image1, builtModule.image2);

    req.session.message = 'Curso creado correctamente.';
    return res.redirect('/dashboard');
    });
    
    // ==========================================
    // RUTAS DE ADMINISTRACIÓN: CONTROL DE USUARIOS
    // ==========================================
    
    // 1. Mostrar la lista de usuarios
    app.get('/admin/users', (req, res) => {
      const users = db.prepare('SELECT id, name, email, role FROM users').all();
      res.render('users_control', { users });
    });
    
    // 2. Actualizar datos, rol o contraseña de un usuario
    app.post('/admin/users/update/:id', (req, res) => {
      const { id } = req.params;
      const { name, email, role, new_password } = req.body;
    
      if (new_password && new_password.trim() !== '') {
        const hashedPassword = bcrypt.hashSync(new_password.trim(), 10);
        db.prepare('UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?')
          .run(name, email.toLowerCase(), role, hashedPassword, id);
      } else {
        db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?')
          .run(name, email.toLowerCase(), role, id);
      }
    
      res.redirect('/admin/users');
    });
    
    // 3. Eliminar usuario
    app.post('/admin/users/delete/:id', (req, res) => {
      const { id } = req.params;
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.redirect('/admin/users');
    });
    
    app.listen(port, () => {
      console.log(`Aplicación lista en http://localhost:${port}`);
    });

app.listen(port, () => {
  console.log(`Aplicación lista en http://localhost:${port}`);
});
