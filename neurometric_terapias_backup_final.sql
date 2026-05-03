--
-- PostgreSQL database dump
--

\restrict T6ECCcPlZQmFsbZbdBlIG9UC3VXCWdBVrk1qh5SSzQLWbDqgbfQDJs5oW2sD6hL

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

-- Started on 2026-05-03 16:13:40 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 32787)
-- Name: actividades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actividades (
    id integer NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    tipo text DEFAULT 'clinica'::text NOT NULL,
    area text,
    subarea text,
    franja_etaria text,
    recursos text,
    goal_library_id integer,
    objetivo_nombre text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 32786)
-- Name: actividades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.actividades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3578 (class 0 OID 0)
-- Dependencies: 231
-- Name: actividades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.actividades_id_seq OWNED BY public.actividades.id;


--
-- TOC entry 238 (class 1259 OID 57345)
-- Name: citas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citas (
    id integer NOT NULL,
    patient_id integer,
    professional_id integer,
    titulo text NOT NULL,
    fecha text NOT NULL,
    hora_inicio text NOT NULL,
    hora_fin text NOT NULL,
    tipo text DEFAULT 'sesion'::text NOT NULL,
    status text DEFAULT 'programada'::text NOT NULL,
    notas text,
    serie_id text,
    repetir_semanal boolean DEFAULT false NOT NULL,
    repetir_hasta text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer
);


--
-- TOC entry 237 (class 1259 OID 57344)
-- Name: citas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3579 (class 0 OID 0)
-- Dependencies: 237
-- Name: citas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citas_id_seq OWNED BY public.citas.id;


--
-- TOC entry 239 (class 1259 OID 73728)
-- Name: express_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.express_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 24621)
-- Name: goal_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_library (
    id integer NOT NULL,
    id_objetivo text NOT NULL,
    nombre_objetivo text NOT NULL,
    modulo text NOT NULL,
    area text NOT NULL,
    subarea text,
    franja_etaria text,
    definicion_operativa text,
    actividades_clinicas text,
    actividades_familia text,
    meta_porcentaje text,
    indicador_tipo text,
    intentos_sugeridos text,
    marco_conceptual text,
    nivel_1_descripcion text,
    nivel_2_descripcion text,
    nivel_3_descripcion text,
    recomendacion_clinica text,
    informe_tecnico text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    area_clinica text,
    nivel_dificultad text DEFAULT 'básico'::text NOT NULL,
    estado_banco text DEFAULT 'activo'::text NOT NULL,
    franja_etaria_min integer,
    franja_etaria_max integer,
    habilidades_relacionadas text,
    prerequisitos text,
    is_custom boolean DEFAULT false NOT NULL,
    created_by integer
);


--
-- TOC entry 223 (class 1259 OID 24620)
-- Name: goal_library_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goal_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3580 (class 0 OID 0)
-- Dependencies: 223
-- Name: goal_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goal_library_id_seq OWNED BY public.goal_library.id;


--
-- TOC entry 234 (class 1259 OID 32801)
-- Name: goal_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_progress (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    nota text,
    status_anterior text,
    status_nuevo text,
    registro_clinico_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    progress_pct integer,
    intentos integer,
    correctas integer
);


--
-- TOC entry 233 (class 1259 OID 32800)
-- Name: goal_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goal_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3581 (class 0 OID 0)
-- Dependencies: 233
-- Name: goal_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goal_progress_id_seq OWNED BY public.goal_progress.id;


--
-- TOC entry 222 (class 1259 OID 24610)
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    status text DEFAULT 'activo'::text NOT NULL,
    target_date text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    codigo text,
    franja_etaria text,
    goal_library_id integer,
    area_clinica text,
    nivel_dificultad text,
    fecha_asignacion text,
    notas text,
    progress_pct integer
);


--
-- TOC entry 221 (class 1259 OID 24609)
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3582 (class 0 OID 0)
-- Dependencies: 221
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- TOC entry 241 (class 1259 OID 98305)
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    mes text NOT NULL,
    tipo text DEFAULT 'particular'::text NOT NULL,
    nombre_obra_social text,
    fecha text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    notas text,
    user_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 240 (class 1259 OID 98304)
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3583 (class 0 OID 0)
-- Dependencies: 240
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- TOC entry 230 (class 1259 OID 32779)
-- Name: patient_professionals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_professionals (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    professional_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 32778)
-- Name: patient_professionals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_professionals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3584 (class 0 OID 0)
-- Dependencies: 229
-- Name: patient_professionals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_professionals_id_seq OWNED BY public.patient_professionals.id;


--
-- TOC entry 216 (class 1259 OID 24577)
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    name text NOT NULL,
    age integer,
    diagnosis text,
    profesional_nombre text,
    franja_etaria text,
    fecha_inicio text,
    progreso text,
    promedio_desempeno real,
    semaforo text,
    observaciones text,
    informe_evolucion text,
    informe_mensual text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    fecha_nacimiento text,
    motivo_consulta text,
    antecedentes text,
    historia_familiar text,
    escolaridad text,
    informe_familia text,
    assigned_professional_id integer,
    lenguaje_comunicacion text,
    atencion_conducta text,
    voz_habla text,
    deglucion text,
    impresion_clinica text
);


--
-- TOC entry 215 (class 1259 OID 24576)
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3585 (class 0 OID 0)
-- Dependencies: 215
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- TOC entry 218 (class 1259 OID 24587)
-- Name: professionals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.professionals (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    specialty text NOT NULL,
    license text,
    status text DEFAULT 'active'::text NOT NULL,
    patient_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 24586)
-- Name: professionals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.professionals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3586 (class 0 OID 0)
-- Dependencies: 217
-- Name: professionals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.professionals_id_seq OWNED BY public.professionals.id;


--
-- TOC entry 226 (class 1259 OID 24633)
-- Name: registros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    patient_name text,
    sesion_numero integer,
    objetivo_nombre text,
    goal_library_id integer,
    area_objetivo text,
    fecha text,
    estado text,
    intentos integer,
    intentos_sugeridos integer,
    correctas integer,
    porcentaje text,
    cumple_meta text,
    recomendacion_clinica text,
    informe_sesion text,
    act_clinicas_obj text,
    act_familia_obj text,
    franja_paciente text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 32769)
-- Name: registros_clinicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_clinicos (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    patient_name text,
    professional_id integer,
    professional_name text,
    fecha text NOT NULL,
    resumen_sesion text,
    observaciones text,
    recomendaciones_hogar text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer
);


--
-- TOC entry 227 (class 1259 OID 32768)
-- Name: registros_clinicos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registros_clinicos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3587 (class 0 OID 0)
-- Dependencies: 227
-- Name: registros_clinicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registros_clinicos_id_seq OWNED BY public.registros_clinicos.id;


--
-- TOC entry 225 (class 1259 OID 24632)
-- Name: registros_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registros_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3588 (class 0 OID 0)
-- Dependencies: 225
-- Name: registros_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registros_id_seq OWNED BY public.registros.id;


--
-- TOC entry 220 (class 1259 OID 24599)
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    professional_id integer,
    date text NOT NULL,
    duration integer NOT NULL,
    type text NOT NULL,
    notes text,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 24598)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3589 (class 0 OID 0)
-- Dependencies: 219
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 236 (class 1259 OID 40961)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'professional'::text NOT NULL,
    professional_id integer,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    specialty text,
    active boolean DEFAULT true NOT NULL
);


--
-- TOC entry 235 (class 1259 OID 40960)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3590 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3352 (class 2604 OID 32790)
-- Name: actividades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades ALTER COLUMN id SET DEFAULT nextval('public.actividades_id_seq'::regclass);


--
-- TOC entry 3361 (class 2604 OID 57348)
-- Name: citas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas ALTER COLUMN id SET DEFAULT nextval('public.citas_id_seq'::regclass);


--
-- TOC entry 3341 (class 2604 OID 24624)
-- Name: goal_library id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_library ALTER COLUMN id SET DEFAULT nextval('public.goal_library_id_seq'::regclass);


--
-- TOC entry 3355 (class 2604 OID 32804)
-- Name: goal_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_progress ALTER COLUMN id SET DEFAULT nextval('public.goal_progress_id_seq'::regclass);


--
-- TOC entry 3338 (class 2604 OID 24613)
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- TOC entry 3366 (class 2604 OID 98308)
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- TOC entry 3350 (class 2604 OID 32782)
-- Name: patient_professionals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_professionals ALTER COLUMN id SET DEFAULT nextval('public.patient_professionals_id_seq'::regclass);


--
-- TOC entry 3329 (class 2604 OID 24580)
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- TOC entry 3331 (class 2604 OID 24590)
-- Name: professionals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionals ALTER COLUMN id SET DEFAULT nextval('public.professionals_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 24636)
-- Name: registros id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros ALTER COLUMN id SET DEFAULT nextval('public.registros_id_seq'::regclass);


--
-- TOC entry 3348 (class 2604 OID 32772)
-- Name: registros_clinicos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_clinicos ALTER COLUMN id SET DEFAULT nextval('public.registros_clinicos_id_seq'::regclass);


--
-- TOC entry 3335 (class 2604 OID 24602)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 3357 (class 2604 OID 40964)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3563 (class 0 OID 32787)
-- Dependencies: 232
-- Data for Name: actividades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actividades (id, titulo, descripcion, tipo, area, subarea, franja_etaria, recursos, goal_library_id, objetivo_nombre, created_at) FROM stdin;
1	Juego de pedir objetos utilizando combinaciones (más jugo, más pelota)	Juego de pedir objetos utilizando combinaciones (más jugo, más pelota)	clinica	Lenguaje Expresivo	Combinación sintáctica inicial	2-3	\N	1	Combinación espontánea de dos palabras	2026-03-13 19:27:03.771252
2	Modelado verbal durante el juego simbólico	Modelado verbal durante el juego simbólico	clinica	Lenguaje Expresivo	Combinación sintáctica inicial	2-3	\N	1	Combinación espontánea de dos palabras	2026-03-13 19:27:03.771252
3	Nombrar objetos y agregar una palabra más (auto grande, perro duerme)	Nombrar objetos y agregar una palabra más (auto grande, perro duerme)	familia	Lenguaje Expresivo	Combinación sintáctica inicial	2-3	\N	1	Combinación espontánea de dos palabras	2026-03-13 19:27:03.771252
4	Esperar que el niño pida algo y modelar combinación (más galleta)	Esperar que el niño pida algo y modelar combinación (más galleta)	familia	Lenguaje Expresivo	Combinación sintáctica inicial	2-3	\N	1	Combinación espontánea de dos palabras	2026-03-13 19:27:03.771252
5	Juego simbólico con accionesImitación motora + verbalRutinas verbalesModelado expandido	Juego simbólico con accionesImitación motora + verbalRutinas verbalesModelado expandido	clinica	Lenguaje Expresivo	Estructuración verbal	2-3	\N	2	Uso espontáneo de verbo	2026-03-13 19:27:03.771252
6	Narrar acciones cotidianasDar opciones verbales (“¿querés comer o tomar?”)Reforzar producciones espontáneas	Narrar acciones cotidianasDar opciones verbales (“¿querés comer o tomar?”)Reforzar producciones espontáneas	familia	Lenguaje Expresivo	Estructuración verbal	2-3	\N	2	Uso espontáneo de verbo	2026-03-13 19:27:03.771252
7	• Juegos de anticipación	• Juegos de anticipación	clinica	Lenguaje Funcional	Intencionalidad comunicativa	2-3	\N	3	Petición verbal espontánea	2026-03-13 19:27:03.771252
8	• Rutinas interrumpidas	• Rutinas interrumpidas	clinica	Lenguaje Funcional	Intencionalidad comunicativa	2-3	\N	3	Petición verbal espontánea	2026-03-13 19:27:03.771252
9	• Esperar iniciativa verbal antes de dar objeto	• Esperar iniciativa verbal antes de dar objeto	familia	Lenguaje Funcional	Intencionalidad comunicativa	2-3	\N	3	Petición verbal espontánea	2026-03-13 19:27:03.771252
10	• Modelar pedidos funcionales	• Modelar pedidos funcionales	familia	Lenguaje Funcional	Intencionalidad comunicativa	2-3	\N	3	Petición verbal espontánea	2026-03-13 19:27:03.771252
11	Rutinas de consignas breves (dame/mostrame/dónde está) con objetos reales.	Rutinas de consignas breves (dame/mostrame/dónde está) con objetos reales.	clinica	Lenguaje Comprensivo-Expresivo	Interacción	2-3	\N	4	Respuesta verbal a consignas simples	2026-03-13 19:27:03.771252
12	Juego de búsqueda (esconder objeto y preguntar “¿dónde está…?”).	Juego de búsqueda (esconder objeto y preguntar “¿dónde está…?”).	clinica	Lenguaje Comprensivo-Expresivo	Interacción	2-3	\N	4	Respuesta verbal a consignas simples	2026-03-13 19:27:03.771252
13	Usar consignas simples en rutinas (baño/comida/juego) y esperar respuesta verbal.	Usar consignas simples en rutinas (baño/comida/juego) y esperar respuesta verbal.	familia	Lenguaje Comprensivo-Expresivo	Interacción	2-3	\N	4	Respuesta verbal a consignas simples	2026-03-13 19:27:03.771252
14	Hacer preguntas funcionales (“¿qué querés?”, “¿dónde está…?”) antes de entregar.	Hacer preguntas funcionales (“¿qué querés?”, “¿dónde está…?”) antes de entregar.	familia	Lenguaje Comprensivo-Expresivo	Interacción	2-3	\N	4	Respuesta verbal a consignas simples	2026-03-13 19:27:03.771252
15	Juego con muñecos realizando acciones (nene come, bebé duerme).	Juego con muñecos realizando acciones (nene come, bebé duerme).	clinica	Lenguaje Expresivo	Sintaxis inicial	2-3	\N	5	Combinación sustantivo + verbo	2026-03-13 19:27:03.771252
16	Tarjetas de acciones con personas o animales.	Tarjetas de acciones con personas o animales.	clinica	Lenguaje Expresivo	Sintaxis inicial	2-3	\N	5	Combinación sustantivo + verbo	2026-03-13 19:27:03.771252
17	Nombrar acciones cotidianas con el niño (mamá cocina, papá trabaja).	Nombrar acciones cotidianas con el niño (mamá cocina, papá trabaja).	familia	Lenguaje Expresivo	Sintaxis inicial	2-3	\N	5	Combinación sustantivo + verbo	2026-03-13 19:27:03.771252
18	Durante el juego con juguetes describir acciones simples.	Durante el juego con juguetes describir acciones simples.	familia	Lenguaje Expresivo	Sintaxis inicial	2-3	\N	5	Combinación sustantivo + verbo	2026-03-13 19:27:03.771252
19	Caja sorpresa con objetos familiares para nombrar.	Caja sorpresa con objetos familiares para nombrar.	clinica	Léxico	Acceso léxico	2-3	\N	6	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
20	Juego de clasificación de objetos cotidianos.	Juego de clasificación de objetos cotidianos.	clinica	Léxico	Acceso léxico	2-3	\N	6	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
21	Nombrar objetos del hogar durante rutinas cotidianas.	Nombrar objetos del hogar durante rutinas cotidianas.	familia	Léxico	Acceso léxico	2-3	\N	6	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
22	Pedir al niño que nombre objetos antes de entregarlos.	Pedir al niño que nombre objetos antes de entregarlos.	familia	Léxico	Acceso léxico	2-3	\N	6	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
23	Descripción de imágenesNarración guiadaExpansión sintácticaReestructuración verbal	Descripción de imágenesNarración guiadaExpansión sintácticaReestructuración verbal	clinica	Lenguaje Expresivo	Sintaxis	6-7	\N	7	Producción de oraciones completas gramaticalmente correctas	2026-03-13 19:27:03.771252
24	Conversaciones narrativasReformulación modeladaJuegos de historiasDescripción diaria de eventos	Conversaciones narrativasReformulación modeladaJuegos de historiasDescripción diaria de eventos	familia	Lenguaje Expresivo	Sintaxis	6-7	\N	7	Producción de oraciones completas gramaticalmente correctas	2026-03-13 19:27:03.771252
25	Ordenar secuencias temporalesCompletar historias con conectoresJuegos de causa–efectoRelatos con tarjetas narrativas	Ordenar secuencias temporalesCompletar historias con conectoresJuegos de causa–efectoRelatos con tarjetas narrativas	clinica	Lenguaje Expresivo	Coherencia y cohesión	6-7	\N	8	Uso adecuado de conectores temporales y causales	2026-03-13 19:27:03.771252
26	• Preguntar “¿por qué?” y “¿qué pasó después?”	• Preguntar “¿por qué?” y “¿qué pasó después?”	familia	Lenguaje Expresivo	Coherencia y cohesión	6-7	\N	8	Uso adecuado de conectores temporales y causales	2026-03-13 19:27:03.771252
27	• Modelar conectores al hablar	• Modelar conectores al hablar	familia	Lenguaje Expresivo	Coherencia y cohesión	6-7	\N	8	Uso adecuado de conectores temporales y causales	2026-03-13 19:27:03.771252
28	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de ini	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace	clinica	Lenguaje Narrativo	Organización discursiva	7-8	\N	9	Narración estructurada de secuencias	2026-03-13 19:27:03.771252
29	• Contar qué pasó en la escuela	• Contar qué pasó en la escuela	familia	Lenguaje Narrativo	Organización discursiva	7-8	\N	9	Narración estructurada de secuencias	2026-03-13 19:27:03.771252
30	• Relatar películas o cuentos	• Relatar películas o cuentos	familia	Lenguaje Narrativo	Organización discursiva	7-8	\N	9	Narración estructurada de secuencias	2026-03-13 19:27:03.771252
31	Preguntas inferenciales sobre imágenesHistorias incompletasDetectar pistas contextualesJuegos de “¿qué creés que pasó?”P	Preguntas inferenciales sobre imágenesHistorias incompletasDetectar pistas contextualesJuegos de “¿qué creés que pasó?”Predicción de finales	clinica	Comprensión	Inferencia	7-8	\N	10	Comprensión y producción de inferencias simples	2026-03-13 19:27:03.771252
32	Preguntar “¿qué creés que va a pasar?”Conversar sobre emociones de personajesAnticipar situaciones cotidianasLeer cuento	Preguntar “¿qué creés que va a pasar?”Conversar sobre emociones de personajesAnticipar situaciones cotidianasLeer cuentos y hacer hipótesis	familia	Comprensión	Inferencia	7-8	\N	10	Comprensión y producción de inferencias simples	2026-03-13 19:27:03.771252
33	• Clasificación semántica	• Clasificación semántica	clinica	Semántica	Vocabulario académico	7-8	\N	11	Uso y comprensión de vocabulario académico	2026-03-13 19:27:03.771252
34	• Definición de palabras	• Definición de palabras	clinica	Semántica	Vocabulario académico	7-8	\N	11	Uso y comprensión de vocabulario académico	2026-03-13 19:27:03.771252
35	• Preguntar significado de palabras nuevas	• Preguntar significado de palabras nuevas	familia	Semántica	Vocabulario académico	7-8	\N	11	Uso y comprensión de vocabulario académico	2026-03-13 19:27:03.771252
36	• Usar vocabulario escolar en conversación diaria	• Usar vocabulario escolar en conversación diaria	familia	Semántica	Vocabulario académico	7-8	\N	11	Uso y comprensión de vocabulario académico	2026-03-13 19:27:03.771252
37	🟢 Menor complejidadSecuencias visuales de 3 imágenesOrdenar tarjetas “primero – después – al final”Relato guiado con pr	🟢 Menor complejidadSecuencias visuales de 3 imágenesOrdenar tarjetas “primero – después – al final”Relato guiado con preguntas estructuradas🟡 Complejidad mediaRelato sin imágenes pero con palabras claveCrear final alternativoDetectar error en secuencia contada por terapeuta🔴 Mayor complejidadRelato espontáneo de experiencia personalRecontar cuento escuchado sin apoyo visualIncluir emoción + problema + solución	clinica	Lenguaje Expresivo	Narrativa oral estructurada	6-7	\N	12	Narración estructurada de experiencias y cuentos breves	2026-03-13 19:27:03.771252
38	Contar “qué fue lo mejor del día” con inicio y finalJuego de “ordenemos la historia”Narrar receta sencilla paso a pasoRe	Contar “qué fue lo mejor del día” con inicio y finalJuego de “ordenemos la historia”Narrar receta sencilla paso a pasoRelatar película breve usando “primero, después, al final”	familia	Lenguaje Expresivo	Narrativa oral estructurada	6-7	\N	12	Narración estructurada de experiencias y cuentos breves	2026-03-13 19:27:03.771252
39	🟢 Menor complejidad“Toca la mesa y después aplaude”Ordenar acciones simples dadas oralmenteJuego de secuencia corporal 	🟢 Menor complejidad“Toca la mesa y después aplaude”Ordenar acciones simples dadas oralmenteJuego de secuencia corporal guiada🟡 Complejidad media“Antes de sentarte, guarda el lápiz”Consignas con distractoresEjecutar mientras escucha música de fondo🔴 Mayor complejidadConsignas condicionales (“Si terminas, entonces…”)Consignas con doble información relevanteEjecución grupal sin repetición	clinica	Comprensión	Comprensión de consignas complejas	6-7	\N	13	Comprensión y ejecución de consignas orales de 2 y 3 pasos con conectores lógicos y temporales.	2026-03-13 19:27:03.771252
40	Juego “Simón dice” con 2–3 pasosDar instrucciones para preparar algo simpleRutina diaria con orden verbalizadoJuego de s	Juego “Simón dice” con 2–3 pasosDar instrucciones para preparar algo simpleRutina diaria con orden verbalizadoJuego de seguir instrucciones en cocina o armado	familia	Comprensión	Comprensión de consignas complejas	6-7	\N	13	Comprensión y ejecución de consignas orales de 2 y 3 pasos con conectores lógicos y temporales.	2026-03-13 19:27:03.771252
41	• “Decime los sonidos de SOL”• “Decí MESA sin la M”• “Cambiá la P de PATO por G”• Tarjetas de sustitución inicial• Manip	• “Decime los sonidos de SOL”• “Decí MESA sin la M”• “Cambiá la P de PATO por G”• Tarjetas de sustitución inicial• Manipulación con fichas o cubos fonémicos• Juego del robot (habla segmentado)	clinica	Metalingüística	Conciencia fonológica avanzada	6-7	\N	14	Manipulación consciente de unidades fonológicas (segmentación, omisión y sustitución de fonemas).	2026-03-13 19:27:03.771252
42	• Juego del “sin” en casa• Rimas modificadas• Palabras inventadas cambiando sonidos• Detectar qué palabra queda si sacam	• Juego del “sin” en casa• Rimas modificadas• Palabras inventadas cambiando sonidos• Detectar qué palabra queda si sacamos un sonido	familia	Metalingüística	Conciencia fonológica avanzada	6-7	\N	14	Manipulación consciente de unidades fonológicas (segmentación, omisión y sustitución de fonemas).	2026-03-13 19:27:03.771252
43	Tarjetas con transformación de palabrasJuego “palabra robot” (desarmar y volver a armar cambiando sonidos)Dominó fonémic	Tarjetas con transformación de palabrasJuego “palabra robot” (desarmar y volver a armar cambiando sonidos)Dominó fonémicoEscalera de palabras (pato → gato → gata → data)	clinica	Metalingüística	Conciencia Fonológica	7-8	\N	15	Manipulación fonémica compleja (adición, omisión y sustitución de fonemas)	2026-03-13 19:27:03.771252
44	Juego oral en el auto: “decime casa sin /k/”Transformaciones divertidas (“si perro empieza con /g/ ¿qué sería?”)Competen	Juego oral en el auto: “decime casa sin /k/”Transformaciones divertidas (“si perro empieza con /g/ ¿qué sería?”)Competencia de palabras inventadasPalabras encadenadas cambiando un sonido	familia	Metalingüística	Conciencia Fonológica	7-8	\N	15	Manipulación fonémica compleja (adición, omisión y sustitución de fonemas)	2026-03-13 19:27:03.771252
45	Tarjetas con sílabas móvilesJuego “palabra desordenada”Bingo de sílaba tónicaCarrera de sílabas (armar palabra más rápid	Tarjetas con sílabas móvilesJuego “palabra desordenada”Bingo de sílaba tónicaCarrera de sílabas (armar palabra más rápido)Dictado silábico con reorganización	clinica	Metalingüística	Conciencia Fonológica	7-8	\N	16	Conciencia silábica compleja y reorganización silábica	2026-03-13 19:27:03.771252
46	Armar palabras con sílabas escritas en papelitosCompetencia de inversión silábica divertidaBuscar palabras con sílaba tr	Armar palabras con sílabas escritas en papelitosCompetencia de inversión silábica divertidaBuscar palabras con sílaba trabada en revistas	familia	Metalingüística	Conciencia Fonológica	7-8	\N	16	Conciencia silábica compleja y reorganización silábica	2026-03-13 19:27:03.771252
47	Señalar y nombrar	Señalar y nombrar	clinica	Comunicación	Integración gesto-verbal	2-3	\N	17	Combinación palabra + gesto significativo	2026-03-13 19:27:03.771252
48	Juegos de pedir objetos	Juegos de pedir objetos	clinica	Comunicación	Integración gesto-verbal	2-3	\N	17	Combinación palabra + gesto significativo	2026-03-13 19:27:03.771252
49	Modelar gestos comunicativos	Modelar gestos comunicativos	familia	Comunicación	Integración gesto-verbal	2-3	\N	17	Combinación palabra + gesto significativo	2026-03-13 19:27:03.771252
50	Reforzar señalamiento	Reforzar señalamiento	familia	Comunicación	Integración gesto-verbal	2-3	\N	17	Combinación palabra + gesto significativo	2026-03-13 19:27:03.771252
51	Caja sorpresa: sacar objetos y nombrarlos.	Caja sorpresa: sacar objetos y nombrarlos.	clinica	Lenguaje Expresivo	Acceso léxico	2-3	\N	18	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
52	Lotería/memotest simple de objetos cotidianos.	Lotería/memotest simple de objetos cotidianos.	clinica	Lenguaje Expresivo	Acceso léxico	2-3	\N	18	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
53	Nombrar objetos en rutina (ropa/comida/baño) y dar tiempo para que el niño lo diga.	Nombrar objetos en rutina (ropa/comida/baño) y dar tiempo para que el niño lo diga.	familia	Lenguaje Expresivo	Acceso léxico	2-3	\N	18	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
54	Antes de entregar, esperar la palabra (“¿qué querés?”) y aceptar aproximaciones.	Antes de entregar, esperar la palabra (“¿qué querés?”) y aceptar aproximaciones.	familia	Lenguaje Expresivo	Acceso léxico	2-3	\N	18	Denominación espontánea de objetos familiares	2026-03-13 19:27:03.771252
55	Rutinas interrumpidas (pausar una actividad favorita y esperar iniciativa).	Rutinas interrumpidas (pausar una actividad favorita y esperar iniciativa).	clinica	Pragmática	Iniciativa comunicativa	2-3	\N	19	Inicio espontáneo de interacción verbal	2026-03-13 19:27:03.771252
56	Juego de turnos (pelota/encastre) con “mi turno/tu turno” y pausas.	Juego de turnos (pelota/encastre) con “mi turno/tu turno” y pausas.	clinica	Pragmática	Iniciativa comunicativa	2-3	\N	19	Inicio espontáneo de interacción verbal	2026-03-13 19:27:03.771252
57	Esperar 5–10 segundos antes de anticiparse (dar oportunidad de iniciar).	Esperar 5–10 segundos antes de anticiparse (dar oportunidad de iniciar).	familia	Pragmática	Iniciativa comunicativa	2-3	\N	19	Inicio espontáneo de interacción verbal	2026-03-13 19:27:03.771252
58	Dejar cosas a la vista y que necesite pedir ayuda.	Dejar cosas a la vista y que necesite pedir ayuda.	familia	Pragmática	Iniciativa comunicativa	2-3	\N	19	Inicio espontáneo de interacción verbal	2026-03-13 19:27:03.771252
59	1️⃣ Juego de órdenes	1️⃣ Juego de órdenes	clinica	Comprensión	Comprensión verbal	2-3	\N	20	Comprensión de consignas simples	2026-03-13 19:27:03.771252
60	Dar consignas simples durante el juego con juguetes.	Dar consignas simples durante el juego con juguetes.	clinica	Comprensión	Comprensión verbal	2-3	\N	20	Comprensión de consignas simples	2026-03-13 19:27:03.771252
61	1️⃣ Consignas en la rutina diaria	1️⃣ Consignas en la rutina diaria	familia	Comprensión	Comprensión verbal	2-3	\N	20	Comprensión de consignas simples	2026-03-13 19:27:03.771252
62	Ejemplo: “traé los zapatos”.	Ejemplo: “traé los zapatos”.	familia	Comprensión	Comprensión verbal	2-3	\N	20	Comprensión de consignas simples	2026-03-13 19:27:03.771252
63	1️⃣ Juego de señalar imágenes	1️⃣ Juego de señalar imágenes	clinica	Comprensión	Semántica	2-3	\N	21	Comprensión de vocabulario cotidiano	2026-03-13 19:27:03.771252
64	Presentar tarjetas con objetos familiares y pedir que el niño señale el objeto nombrado.	Presentar tarjetas con objetos familiares y pedir que el niño señale el objeto nombrado.	clinica	Comprensión	Semántica	2-3	\N	21	Comprensión de vocabulario cotidiano	2026-03-13 19:27:03.771252
65	1️⃣ Nombrar objetos del hogar	1️⃣ Nombrar objetos del hogar	familia	Comprensión	Semántica	2-3	\N	21	Comprensión de vocabulario cotidiano	2026-03-13 19:27:03.771252
66	Durante las rutinas diarias pedir al niño que identifique objetos.	Durante las rutinas diarias pedir al niño que identifique objetos.	familia	Comprensión	Semántica	2-3	\N	21	Comprensión de vocabulario cotidiano	2026-03-13 19:27:03.771252
67	1️⃣ Juego de señalar objetos	1️⃣ Juego de señalar objetos	clinica	Pragmática	Comunicación no verbal	2-3	\N	22	Uso de gestos comunicativos	2026-03-13 19:27:03.771252
68	Colocar objetos atractivos y esperar que el niño los señale para pedirlos.	Colocar objetos atractivos y esperar que el niño los señale para pedirlos.	clinica	Pragmática	Comunicación no verbal	2-3	\N	22	Uso de gestos comunicativos	2026-03-13 19:27:03.771252
69	1️⃣ Modelar gestos comunicativos	1️⃣ Modelar gestos comunicativos	familia	Pragmática	Comunicación no verbal	2-3	\N	22	Uso de gestos comunicativos	2026-03-13 19:27:03.771252
70	Los adultos pueden modelar gestos durante las rutinas.	Los adultos pueden modelar gestos durante las rutinas.	familia	Pragmática	Comunicación no verbal	2-3	\N	22	Uso de gestos comunicativos	2026-03-13 19:27:03.771252
71	Repetición de sílabas en espejo	El profesional modela la sílaba frente al espejo y el niño imita	clinica	habla	\N	\N	\N	5	\N	2026-03-16 17:38:39.518279
73	Práctica de respiración diafragmática (avanzada)	El niño toma aire por la nariz contando 3 tiempos y suelta por la boca	clinica	Lenguaje Expresivo	\N	\N	Pelota de espuma, espejo	27	Usar conectores causales y temporales en discurso oral	2026-03-16 17:40:27.254262
75	Denominación rápida de imágenes (con tiempo)	Mostrar láminas y el paciente nombra en 3 segundos	clinica	Lenguaje Expresivo	\N	\N	\N	27	Usar conectores causales y temporales en discurso oral	2026-03-16 17:47:29.685864
\.


--
-- TOC entry 3569 (class 0 OID 57345)
-- Dependencies: 238
-- Data for Name: citas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.citas (id, patient_id, professional_id, titulo, fecha, hora_inicio, hora_fin, tipo, status, notas, serie_id, repetir_semanal, repetir_hasta, created_at, user_id) FROM stdin;
1	7	\N	Alvaro Sampietro	2026-04-20	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
2	7	\N	Alvaro Sampietro	2026-04-27	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
3	7	\N	Alvaro Sampietro	2026-05-04	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
4	7	\N	Alvaro Sampietro	2026-05-11	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
5	7	\N	Alvaro Sampietro	2026-05-18	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
6	7	\N	Alvaro Sampietro	2026-05-25	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
7	7	\N	Alvaro Sampietro	2026-06-01	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
8	7	\N	Alvaro Sampietro	2026-06-08	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
9	7	\N	Alvaro Sampietro	2026-06-15	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
15	7	\N	Alvaro Sampietro	2026-07-27	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
16	7	\N	Alvaro Sampietro	2026-08-03	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
17	7	\N	Alvaro Sampietro	2026-08-10	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
18	7	\N	Alvaro Sampietro	2026-08-17	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
19	7	\N	Alvaro Sampietro	2026-08-24	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
20	7	\N	Alvaro Sampietro	2026-08-31	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
81	7	\N	Alvaro Sampietro	2026-10-26	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
82	7	\N	Alvaro Sampietro	2026-11-02	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
83	7	\N	Alvaro Sampietro	2026-11-09	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
84	7	\N	Alvaro Sampietro	2026-11-16	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
85	7	\N	Alvaro Sampietro	2026-11-23	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
86	7	\N	Alvaro Sampietro	2026-11-30	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
87	7	\N	Alvaro Sampietro	2026-12-07	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
88	7	\N	Alvaro Sampietro	2026-12-14	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
91	7	\N	Alvaro Sampietro	2027-01-04	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
92	7	\N	Alvaro Sampietro	2027-01-11	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
93	7	\N	Alvaro Sampietro	2027-01-18	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
330	7	2	Alvaro Sampietro	2026-07-13	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
10	7	\N	Alvaro Sampietro	2026-06-22	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
11	7	\N	Alvaro Sampietro	2026-06-29	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
12	7	\N	Alvaro Sampietro	2026-07-06	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
13	7	\N	Alvaro Sampietro	2026-07-13	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
14	7	\N	Alvaro Sampietro	2026-07-20	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
89	7	\N	Alvaro Sampietro	2026-12-21	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
90	7	\N	Alvaro Sampietro	2026-12-28	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
66	7	\N	Alvaro Sampietro	2026-07-13	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
67	7	\N	Alvaro Sampietro	2026-07-20	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
68	7	\N	Alvaro Sampietro	2026-07-27	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
69	7	\N	Alvaro Sampietro	2026-08-03	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
70	7	\N	Alvaro Sampietro	2026-08-10	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
71	7	\N	Alvaro Sampietro	2026-08-17	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
72	7	\N	Alvaro Sampietro	2026-08-24	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
73	7	\N	Alvaro Sampietro	2026-08-31	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
74	7	\N	Alvaro Sampietro	2026-09-07	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
75	7	\N	Alvaro Sampietro	2026-09-14	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
76	7	\N	Alvaro Sampietro	2026-09-21	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
77	7	\N	Alvaro Sampietro	2026-09-28	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
78	7	\N	Alvaro Sampietro	2026-10-05	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
79	7	\N	Alvaro Sampietro	2026-10-12	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
80	7	\N	Alvaro Sampietro	2026-10-19	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
331	7	2	Alvaro Sampietro	2026-07-20	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
332	7	2	Alvaro Sampietro	2026-07-27	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
333	7	2	Alvaro Sampietro	2026-08-03	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
334	7	2	Alvaro Sampietro	2026-08-10	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
335	7	2	Alvaro Sampietro	2026-08-17	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
337	7	2	Alvaro Sampietro	2026-08-31	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
338	7	2	Alvaro Sampietro	2026-09-07	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
339	7	2	Alvaro Sampietro	2026-09-14	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
340	7	2	Alvaro Sampietro	2026-09-21	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
341	7	2	Alvaro Sampietro	2026-09-28	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
342	7	2	Alvaro Sampietro	2026-10-05	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
343	7	2	Alvaro Sampietro	2026-10-12	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
344	7	2	Alvaro Sampietro	2026-10-19	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
346	7	2	Alvaro Sampietro	2026-11-02	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
347	7	2	Alvaro Sampietro	2026-11-09	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
348	7	2	Alvaro Sampietro	2026-11-16	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
349	7	2	Alvaro Sampietro	2026-11-23	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
350	7	2	Alvaro Sampietro	2026-11-30	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
351	7	2	Alvaro Sampietro	2026-12-07	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
352	7	2	Alvaro Sampietro	2026-12-14	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
354	7	2	Alvaro Sampietro	2026-12-28	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
355	7	2	Alvaro Sampietro	2027-01-04	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
356	7	2	Alvaro Sampietro	2027-01-11	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
357	7	2	Alvaro Sampietro	2027-01-18	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
358	7	2	Alvaro Sampietro	2027-01-25	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
359	7	2	Alvaro Sampietro	2027-02-01	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
360	7	2	Alvaro Sampietro	2027-02-08	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
362	7	2	Alvaro Sampietro	2027-02-22	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
363	7	2	Alvaro Sampietro	2027-03-01	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
364	7	2	Alvaro Sampietro	2027-03-08	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
365	7	2	Alvaro Sampietro	2027-03-15	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
366	7	2	Alvaro Sampietro	2027-03-22	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
367	7	2	Alvaro Sampietro	2027-03-29	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
368	7	2	Alvaro Sampietro	2027-04-05	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
106	7	\N	Alvaro Sampietro	2027-04-19	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
108	8	2	Helena	2026-04-29	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
109	8	2	Helena	2026-05-06	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
110	8	2	Helena	2026-05-13	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
111	8	2	Helena	2026-05-20	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
112	8	2	Helena	2026-05-27	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
113	8	2	Helena	2026-06-03	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
114	8	2	Helena	2026-06-10	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
115	8	2	Helena	2026-06-17	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
116	8	2	Helena	2026-06-24	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
369	7	2	Alvaro Sampietro	2027-04-12	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
370	7	2	Alvaro Sampietro	2027-04-19	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
34	7	\N	Alvaro Sampietro	2026-12-07	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
35	7	\N	Alvaro Sampietro	2026-12-14	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
36	7	\N	Alvaro Sampietro	2026-12-21	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
37	7	\N	Alvaro Sampietro	2026-12-28	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
38	7	\N	Alvaro Sampietro	2027-01-04	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
39	7	\N	Alvaro Sampietro	2027-01-11	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
40	7	\N	Alvaro Sampietro	2027-01-18	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
41	7	\N	Alvaro Sampietro	2027-01-25	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
42	7	\N	Alvaro Sampietro	2027-02-01	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
43	7	\N	Alvaro Sampietro	2027-02-08	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
44	7	\N	Alvaro Sampietro	2027-02-15	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
45	7	\N	Alvaro Sampietro	2027-02-22	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
46	7	\N	Alvaro Sampietro	2027-03-01	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
47	7	\N	Alvaro Sampietro	2027-03-08	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
48	7	\N	Alvaro Sampietro	2027-03-15	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
49	7	\N	Alvaro Sampietro	2027-03-22	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
50	7	\N	Alvaro Sampietro	2027-03-29	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
51	7	\N	Alvaro Sampietro	2027-04-05	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
65	7	\N	Alvaro Sampietro	2026-07-06	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
94	7	\N	Alvaro Sampietro	2027-01-25	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
95	7	\N	Alvaro Sampietro	2027-02-01	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
96	7	\N	Alvaro Sampietro	2027-02-08	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
97	7	\N	Alvaro Sampietro	2027-02-15	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
98	7	\N	Alvaro Sampietro	2027-02-22	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
99	7	\N	Alvaro Sampietro	2027-03-01	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
100	7	\N	Alvaro Sampietro	2027-03-08	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
101	7	\N	Alvaro Sampietro	2027-03-15	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
102	7	\N	Alvaro Sampietro	2027-03-22	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
103	7	\N	Alvaro Sampietro	2027-03-29	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
104	7	\N	Alvaro Sampietro	2027-04-05	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
105	7	\N	Alvaro Sampietro	2027-04-12	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
371	7	2	Alvaro Sampietro	2027-04-26	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
372	11	5	Gonzalo Soler	2026-04-24	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
374	11	5	Gonzalo Soler	2026-05-08	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
375	11	5	Gonzalo Soler	2026-05-15	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
376	11	5	Gonzalo Soler	2026-05-22	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
377	11	5	Gonzalo Soler	2026-05-29	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
378	11	5	Gonzalo Soler	2026-06-05	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
379	11	5	Gonzalo Soler	2026-06-12	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
171	9	2	Hanna	2026-07-08	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
172	9	2	Hanna	2026-07-15	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
173	9	2	Hanna	2026-07-22	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
174	9	2	Hanna	2026-07-29	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
175	9	2	Hanna	2026-08-05	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
176	9	2	Hanna	2026-08-12	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
221	10	2	Darian	2026-06-17	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
52	7	\N	Alvaro Sampietro	2027-04-12	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
53	7	\N	Alvaro Sampietro	2027-04-19	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
54	7	\N	Alvaro Sampietro	2026-04-20	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
55	7	\N	Alvaro Sampietro	2026-04-27	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
56	7	\N	Alvaro Sampietro	2026-05-04	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
57	7	\N	Alvaro Sampietro	2026-05-11	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
58	7	\N	Alvaro Sampietro	2026-05-18	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
59	7	\N	Alvaro Sampietro	2026-05-25	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
60	7	\N	Alvaro Sampietro	2026-06-01	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
61	7	\N	Alvaro Sampietro	2026-06-08	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
62	7	\N	Alvaro Sampietro	2026-06-15	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
63	7	\N	Alvaro Sampietro	2026-06-22	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
170	9	2	Hanna	2026-07-01	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
222	10	2	Darian	2026-06-24	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
237	10	2	Darian	2026-10-07	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
238	10	2	Darian	2026-10-14	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
239	10	2	Darian	2026-10-21	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
240	10	2	Darian	2026-10-28	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
241	10	2	Darian	2026-11-04	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
242	10	2	Darian	2026-11-11	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
243	10	2	Darian	2026-11-18	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
244	10	2	Darian	2026-11-25	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
245	10	2	Darian	2026-12-02	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
246	10	2	Darian	2026-12-09	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
247	10	2	Darian	2026-12-16	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
248	10	2	Darian	2026-12-23	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
249	10	2	Darian	2026-12-30	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
250	10	2	Darian	2027-01-06	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
251	10	2	Darian	2027-01-13	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
252	10	2	Darian	2027-01-20	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
253	10	2	Darian	2027-01-27	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
254	10	2	Darian	2027-02-03	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
255	10	2	Darian	2027-02-10	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
256	10	2	Darian	2027-02-17	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
257	10	2	Darian	2027-02-24	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
258	10	2	Darian	2027-03-03	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
259	10	2	Darian	2027-03-10	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
260	10	2	Darian	2027-03-17	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
261	10	2	Darian	2027-03-24	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
380	11	5	Gonzalo Soler	2026-06-19	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
381	11	5	Gonzalo Soler	2026-06-26	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
382	11	5	Gonzalo Soler	2026-07-03	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
383	11	5	Gonzalo Soler	2026-07-10	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
21	7	\N	Alvaro Sampietro	2026-09-07	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
22	7	\N	Alvaro Sampietro	2026-09-14	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
23	7	\N	Alvaro Sampietro	2026-09-21	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
24	7	\N	Alvaro Sampietro	2026-09-28	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
25	7	\N	Alvaro Sampietro	2026-10-05	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
26	7	\N	Alvaro Sampietro	2026-10-12	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
27	7	\N	Alvaro Sampietro	2026-10-19	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
28	7	\N	Alvaro Sampietro	2026-10-26	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
29	7	\N	Alvaro Sampietro	2026-11-02	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
30	7	\N	Alvaro Sampietro	2026-11-09	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
31	7	\N	Alvaro Sampietro	2026-11-16	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
32	7	\N	Alvaro Sampietro	2026-11-23	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
33	7	\N	Alvaro Sampietro	2026-11-30	18:00	19:00	sesion	programada	\N	f260bc2c-5f3f-44b4-8ee1-ece7aab19f94	t	\N	2026-04-21 13:11:23.783576	\N
64	7	\N	Alvaro Sampietro	2026-06-29	18:00	19:00	sesion	programada	\N	f41a3dbb-656a-4e74-9363-29fe262e4415	t	\N	2026-04-21 13:11:55.191705	\N
107	8	2	Helena	2026-04-22	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
117	8	2	Helena	2026-07-01	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
120	8	2	Helena	2026-07-22	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
133	8	2	Helena	2026-10-21	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
146	8	2	Helena	2027-01-20	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
159	8	2	Helena	2027-04-21	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
328	7	2	Alvaro Sampietro	2026-06-29	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
336	7	2	Alvaro Sampietro	2026-08-24	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
345	7	2	Alvaro Sampietro	2026-10-26	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
353	7	2	Alvaro Sampietro	2026-12-21	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
361	7	2	Alvaro Sampietro	2027-02-15	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
373	11	5	Gonzalo Soler	2026-05-01	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
384	11	5	Gonzalo Soler	2026-07-17	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
385	11	5	Gonzalo Soler	2026-07-24	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
386	11	5	Gonzalo Soler	2026-07-31	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
387	11	5	Gonzalo Soler	2026-08-07	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
388	11	5	Gonzalo Soler	2026-08-14	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
389	11	5	Gonzalo Soler	2026-08-21	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
390	11	5	Gonzalo Soler	2026-08-28	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
391	11	5	Gonzalo Soler	2026-09-04	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
392	11	5	Gonzalo Soler	2026-09-11	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
393	11	5	Gonzalo Soler	2026-09-18	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
394	11	5	Gonzalo Soler	2026-09-25	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
395	11	5	Gonzalo Soler	2026-10-02	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
396	11	5	Gonzalo Soler	2026-10-09	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
232	10	2	Darian	2026-09-02	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
233	10	2	Darian	2026-09-09	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
234	10	2	Darian	2026-09-16	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
235	10	2	Darian	2026-09-23	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
236	10	2	Darian	2026-09-30	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
262	10	2	Darian	2027-03-31	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
263	10	2	Darian	2027-04-07	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
264	10	2	Darian	2027-04-14	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
265	10	2	Darian	2027-04-21	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
267	7	2	Alvaro Sampietro	2026-04-29	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
268	7	2	Alvaro Sampietro	2026-05-06	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
269	7	2	Alvaro Sampietro	2026-05-13	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
270	7	2	Alvaro Sampietro	2026-05-20	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
271	7	2	Alvaro Sampietro	2026-05-27	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
223	10	2	Darian	2026-07-01	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
224	10	2	Darian	2026-07-08	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
225	10	2	Darian	2026-07-15	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
226	10	2	Darian	2026-07-22	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
227	10	2	Darian	2026-07-29	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
228	10	2	Darian	2026-08-05	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
229	10	2	Darian	2026-08-12	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
230	10	2	Darian	2026-08-19	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
231	10	2	Darian	2026-08-26	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
272	7	2	Alvaro Sampietro	2026-06-03	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
273	7	2	Alvaro Sampietro	2026-06-10	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
274	7	2	Alvaro Sampietro	2026-06-17	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
275	7	2	Alvaro Sampietro	2026-06-24	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
276	7	2	Alvaro Sampietro	2026-07-01	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
277	7	2	Alvaro Sampietro	2026-07-08	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
278	7	2	Alvaro Sampietro	2026-07-15	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
279	7	2	Alvaro Sampietro	2026-07-22	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
280	7	2	Alvaro Sampietro	2026-07-29	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
281	7	2	Alvaro Sampietro	2026-08-05	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
282	7	2	Alvaro Sampietro	2026-08-12	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
283	7	2	Alvaro Sampietro	2026-08-19	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
284	7	2	Alvaro Sampietro	2026-08-26	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
285	7	2	Alvaro Sampietro	2026-09-02	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
286	7	2	Alvaro Sampietro	2026-09-09	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
266	7	2	Alvaro Sampietro	2026-04-22	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
397	11	5	Gonzalo Soler	2026-10-16	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
398	11	5	Gonzalo Soler	2026-10-23	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
399	11	5	Gonzalo Soler	2026-10-30	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
400	11	5	Gonzalo Soler	2026-11-06	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
401	11	5	Gonzalo Soler	2026-11-13	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
402	11	5	Gonzalo Soler	2026-11-20	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
403	11	5	Gonzalo Soler	2026-11-27	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
404	11	5	Gonzalo Soler	2026-12-04	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
405	11	5	Gonzalo Soler	2026-12-11	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
406	11	5	Gonzalo Soler	2026-12-18	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
407	11	5	Gonzalo Soler	2026-12-25	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
408	11	5	Gonzalo Soler	2027-01-01	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
409	11	5	Gonzalo Soler	2027-01-08	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
410	11	5	Gonzalo Soler	2027-01-15	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
411	11	5	Gonzalo Soler	2027-01-22	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
412	11	5	Gonzalo Soler	2027-01-29	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
413	11	5	Gonzalo Soler	2027-02-05	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
414	11	5	Gonzalo Soler	2027-02-12	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
415	11	5	Gonzalo Soler	2027-02-19	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
416	11	5	Gonzalo Soler	2027-02-26	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
417	11	5	Gonzalo Soler	2027-03-05	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
418	11	5	Gonzalo Soler	2027-03-12	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
419	11	5	Gonzalo Soler	2027-03-19	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
420	11	5	Gonzalo Soler	2027-03-26	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
421	11	5	Gonzalo Soler	2027-04-02	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
422	11	5	Gonzalo Soler	2027-04-09	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
423	11	5	Gonzalo Soler	2027-04-16	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
424	11	5	Gonzalo Soler	2027-04-23	14:45	15:30	sesion	programada	\N	adbfe1b1-9fff-4584-bd23-277956850050	t	\N	2026-04-23 02:14:48.741185	5
425	16	6	Thiago	2026-04-24	19:15	20:00	sesion	programada	\N	\N	f	\N	2026-04-24 14:34:10.486569	6
426	19	6	Bautista	2026-04-24	20:00	20:45	sesion	programada	\N	\N	f	\N	2026-04-24 14:34:40.119533	6
427	23	6	Leocadio	2026-04-24	18:30	19:15	sesion	programada	\N	\N	f	\N	2026-04-24 14:35:46.806913	6
428	24	3	Demo 1	2026-04-24	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
429	24	3	Demo 1	2026-05-01	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
430	24	3	Demo 1	2026-05-08	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
431	24	3	Demo 1	2026-05-15	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
432	24	3	Demo 1	2026-05-22	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
433	24	3	Demo 1	2026-05-29	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
434	24	3	Demo 1	2026-06-05	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
435	24	3	Demo 1	2026-06-12	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
436	24	3	Demo 1	2026-06-19	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
437	24	3	Demo 1	2026-06-26	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
438	24	3	Demo 1	2026-07-03	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
439	24	3	Demo 1	2026-07-10	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
440	24	3	Demo 1	2026-07-17	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
441	24	3	Demo 1	2026-07-24	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
442	24	3	Demo 1	2026-07-31	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
443	24	3	Demo 1	2026-08-07	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
444	24	3	Demo 1	2026-08-14	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
445	24	3	Demo 1	2026-08-21	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
446	24	3	Demo 1	2026-08-28	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
447	24	3	Demo 1	2026-09-04	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
448	24	3	Demo 1	2026-09-11	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
449	24	3	Demo 1	2026-09-18	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
450	24	3	Demo 1	2026-09-25	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
451	24	3	Demo 1	2026-10-02	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
452	24	3	Demo 1	2026-10-09	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
453	24	3	Demo 1	2026-10-16	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
454	24	3	Demo 1	2026-10-23	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
455	24	3	Demo 1	2026-10-30	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
456	24	3	Demo 1	2026-11-06	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
457	24	3	Demo 1	2026-11-13	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
458	24	3	Demo 1	2026-11-20	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
459	24	3	Demo 1	2026-11-27	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
460	24	3	Demo 1	2026-12-04	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
461	24	3	Demo 1	2026-12-11	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
462	24	3	Demo 1	2026-12-18	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
463	24	3	Demo 1	2026-12-25	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
464	24	3	Demo 1	2027-01-01	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
465	24	3	Demo 1	2027-01-08	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
466	24	3	Demo 1	2027-01-15	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
467	24	3	Demo 1	2027-01-22	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
468	24	3	Demo 1	2027-01-29	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
469	24	3	Demo 1	2027-02-05	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
470	24	3	Demo 1	2027-02-12	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
471	24	3	Demo 1	2027-02-19	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
472	24	3	Demo 1	2027-02-26	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
473	24	3	Demo 1	2027-03-05	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
474	24	3	Demo 1	2027-03-12	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
475	24	3	Demo 1	2027-03-19	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
476	24	3	Demo 1	2027-03-26	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
477	24	3	Demo 1	2027-04-02	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
478	24	3	Demo 1	2027-04-09	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
479	24	3	Demo 1	2027-04-16	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
480	24	3	Demo 1	2027-04-23	09:00	10:00	sesion	cancelada	\N	9c7fabd9-5608-4876-926d-ffbcfc6711b5	t	\N	2026-04-25 01:51:54.152716	3
481	24	3	Demo 1	2026-04-20	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
482	24	3	Demo 1	2026-04-27	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
483	24	3	Demo 1	2026-05-04	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
484	24	3	Demo 1	2026-05-11	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
485	24	3	Demo 1	2026-05-18	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
486	24	3	Demo 1	2026-05-25	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
487	24	3	Demo 1	2026-06-01	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
488	24	3	Demo 1	2026-06-08	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
489	24	3	Demo 1	2026-06-15	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
490	24	3	Demo 1	2026-06-22	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
491	24	3	Demo 1	2026-06-29	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
492	24	3	Demo 1	2026-07-06	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
493	24	3	Demo 1	2026-07-13	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
494	24	3	Demo 1	2026-07-20	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
495	24	3	Demo 1	2026-07-27	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
496	24	3	Demo 1	2026-08-03	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
497	24	3	Demo 1	2026-08-10	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
498	24	3	Demo 1	2026-08-17	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
499	24	3	Demo 1	2026-08-24	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
500	24	3	Demo 1	2026-08-31	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
501	24	3	Demo 1	2026-09-07	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
502	24	3	Demo 1	2026-09-14	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
503	24	3	Demo 1	2026-09-21	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
504	24	3	Demo 1	2026-09-28	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
505	24	3	Demo 1	2026-10-05	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
506	24	3	Demo 1	2026-10-12	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
507	24	3	Demo 1	2026-10-19	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
508	24	3	Demo 1	2026-10-26	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
509	24	3	Demo 1	2026-11-02	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
510	24	3	Demo 1	2026-11-09	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
511	24	3	Demo 1	2026-11-16	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
512	24	3	Demo 1	2026-11-23	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
513	24	3	Demo 1	2026-11-30	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
514	24	3	Demo 1	2026-12-07	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
515	24	3	Demo 1	2026-12-14	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
516	24	3	Demo 1	2026-12-21	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
517	24	3	Demo 1	2026-12-28	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
518	24	3	Demo 1	2027-01-04	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
519	24	3	Demo 1	2027-01-11	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
520	24	3	Demo 1	2027-01-18	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
521	24	3	Demo 1	2027-01-25	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
522	24	3	Demo 1	2027-02-01	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
523	24	3	Demo 1	2027-02-08	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
524	24	3	Demo 1	2027-02-15	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
525	24	3	Demo 1	2027-02-22	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
526	24	3	Demo 1	2027-03-01	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
527	24	3	Demo 1	2027-03-08	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
528	24	3	Demo 1	2027-03-15	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
529	24	3	Demo 1	2027-03-22	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
530	24	3	Demo 1	2027-03-29	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
531	24	3	Demo 1	2027-04-05	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
532	24	3	Demo 1	2027-04-12	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
533	24	3	Demo 1	2027-04-19	09:00	10:00	sesion	programada	\N	884bb624-1b15-4acd-bcfc-c763437726da	t	\N	2026-04-25 01:52:20.312726	3
534	12	1	Demo 1	2026-04-27	18:00	19:00	sesion	programada	\N	\N	f	\N	2026-04-27 17:27:53.419295	1
319	7	2	Alvaro Sampietro	2026-04-27	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
320	7	2	Alvaro Sampietro	2026-05-04	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
321	7	2	Alvaro Sampietro	2026-05-11	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
322	7	2	Alvaro Sampietro	2026-05-18	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
323	7	2	Alvaro Sampietro	2026-05-25	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
324	7	2	Alvaro Sampietro	2026-06-01	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
316	7	2	Alvaro Sampietro	2027-04-07	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
287	7	2	Alvaro Sampietro	2026-09-16	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
288	7	2	Alvaro Sampietro	2026-09-23	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
289	7	2	Alvaro Sampietro	2026-09-30	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
290	7	2	Alvaro Sampietro	2026-10-07	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
291	7	2	Alvaro Sampietro	2026-10-14	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
292	7	2	Alvaro Sampietro	2026-10-21	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
293	7	2	Alvaro Sampietro	2026-10-28	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
294	7	2	Alvaro Sampietro	2026-11-04	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
295	7	2	Alvaro Sampietro	2026-11-11	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
296	7	2	Alvaro Sampietro	2026-11-18	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
297	7	2	Alvaro Sampietro	2026-11-25	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
298	7	2	Alvaro Sampietro	2026-12-02	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
299	7	2	Alvaro Sampietro	2026-12-09	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
301	7	2	Alvaro Sampietro	2026-12-23	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
302	7	2	Alvaro Sampietro	2026-12-30	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
303	7	2	Alvaro Sampietro	2027-01-06	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
304	7	2	Alvaro Sampietro	2027-01-13	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
305	7	2	Alvaro Sampietro	2027-01-20	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
306	7	2	Alvaro Sampietro	2027-01-27	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
307	7	2	Alvaro Sampietro	2027-02-03	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
308	7	2	Alvaro Sampietro	2027-02-10	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
309	7	2	Alvaro Sampietro	2027-02-17	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
310	7	2	Alvaro Sampietro	2027-02-24	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
311	7	2	Alvaro Sampietro	2027-03-03	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
312	7	2	Alvaro Sampietro	2027-03-10	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
313	7	2	Alvaro Sampietro	2027-03-17	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
314	7	2	Alvaro Sampietro	2027-03-24	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
317	7	2	Alvaro Sampietro	2027-04-14	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
318	7	2	Alvaro Sampietro	2027-04-21	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
300	7	2	Alvaro Sampietro	2026-12-16	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
315	7	2	Alvaro Sampietro	2027-03-31	18:00	19:00	sesion	cancelada		df5ab560-7204-418f-b1b2-667ff2380ff0	t	\N	2026-04-22 16:51:03.319572	2
118	8	2	Helena	2026-07-08	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
119	8	2	Helena	2026-07-15	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
121	8	2	Helena	2026-07-29	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
122	8	2	Helena	2026-08-05	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
123	8	2	Helena	2026-08-12	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
124	8	2	Helena	2026-08-19	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
125	8	2	Helena	2026-08-26	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
126	8	2	Helena	2026-09-02	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
127	8	2	Helena	2026-09-09	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
128	8	2	Helena	2026-09-16	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
129	8	2	Helena	2026-09-23	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
130	8	2	Helena	2026-09-30	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
131	8	2	Helena	2026-10-07	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
132	8	2	Helena	2026-10-14	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
134	8	2	Helena	2026-10-28	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
135	8	2	Helena	2026-11-04	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
136	8	2	Helena	2026-11-11	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
137	8	2	Helena	2026-11-18	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
138	8	2	Helena	2026-11-25	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
139	8	2	Helena	2026-12-02	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
140	8	2	Helena	2026-12-09	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
141	8	2	Helena	2026-12-16	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
142	8	2	Helena	2026-12-23	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
143	8	2	Helena	2026-12-30	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
144	8	2	Helena	2027-01-06	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
145	8	2	Helena	2027-01-13	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
147	8	2	Helena	2027-01-27	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
148	8	2	Helena	2027-02-03	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
149	8	2	Helena	2027-02-10	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
150	8	2	Helena	2027-02-17	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
151	8	2	Helena	2027-02-24	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
152	8	2	Helena	2027-03-03	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
153	8	2	Helena	2027-03-10	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
154	8	2	Helena	2027-03-17	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
155	8	2	Helena	2027-03-24	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
156	8	2	Helena	2027-03-31	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
157	8	2	Helena	2027-04-07	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
158	8	2	Helena	2027-04-14	18:00	18:30	sesion	programada	\N	8e6dbef8-4d96-48a6-b477-3a8acc0ee3dd	t	\N	2026-04-22 16:49:55.058311	2
160	9	2	Hanna	2026-04-22	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
161	9	2	Hanna	2026-04-29	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
162	9	2	Hanna	2026-05-06	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
163	9	2	Hanna	2026-05-13	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
164	9	2	Hanna	2026-05-20	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
165	9	2	Hanna	2026-05-27	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
166	9	2	Hanna	2026-06-03	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
325	7	2	Alvaro Sampietro	2026-06-08	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
326	7	2	Alvaro Sampietro	2026-06-15	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
327	7	2	Alvaro Sampietro	2026-06-22	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
329	7	2	Alvaro Sampietro	2026-07-06	18:00	19:00	sesion	programada	\N	3a30c53f-01dc-4140-a994-c9e9d475d5da	t	\N	2026-04-22 16:51:33.098984	2
167	9	2	Hanna	2026-06-10	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
168	9	2	Hanna	2026-06-17	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
169	9	2	Hanna	2026-06-24	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
177	9	2	Hanna	2026-08-19	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
178	9	2	Hanna	2026-08-26	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
179	9	2	Hanna	2026-09-02	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
180	9	2	Hanna	2026-09-09	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
181	9	2	Hanna	2026-09-16	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
182	9	2	Hanna	2026-09-23	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
183	9	2	Hanna	2026-09-30	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
184	9	2	Hanna	2026-10-07	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
185	9	2	Hanna	2026-10-14	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
186	9	2	Hanna	2026-10-21	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
187	9	2	Hanna	2026-10-28	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
188	9	2	Hanna	2026-11-04	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
189	9	2	Hanna	2026-11-11	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
190	9	2	Hanna	2026-11-18	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
191	9	2	Hanna	2026-11-25	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
192	9	2	Hanna	2026-12-02	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
193	9	2	Hanna	2026-12-09	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
194	9	2	Hanna	2026-12-16	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
195	9	2	Hanna	2026-12-23	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
196	9	2	Hanna	2026-12-30	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
197	9	2	Hanna	2027-01-06	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
198	9	2	Hanna	2027-01-13	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
199	9	2	Hanna	2027-01-20	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
200	9	2	Hanna	2027-01-27	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
201	9	2	Hanna	2027-02-03	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
202	9	2	Hanna	2027-02-10	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
203	9	2	Hanna	2027-02-17	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
204	9	2	Hanna	2027-02-24	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
205	9	2	Hanna	2027-03-03	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
206	9	2	Hanna	2027-03-10	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
207	9	2	Hanna	2027-03-17	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
208	9	2	Hanna	2027-03-24	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
209	9	2	Hanna	2027-03-31	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
210	9	2	Hanna	2027-04-07	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
211	9	2	Hanna	2027-04-14	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
212	9	2	Hanna	2027-04-21	18:30	19:00	sesion	programada	\N	5ceb5006-f796-4882-8d1d-8fcd110da947	t	\N	2026-04-22 16:50:17.0009	2
213	10	2	Darian	2026-04-22	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
214	10	2	Darian	2026-04-29	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
215	10	2	Darian	2026-05-06	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
216	10	2	Darian	2026-05-13	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
217	10	2	Darian	2026-05-20	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
218	10	2	Darian	2026-05-27	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
219	10	2	Darian	2026-06-03	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
220	10	2	Darian	2026-06-10	19:00	19:30	sesion	programada	\N	9a9ae9a1-c1f0-4e2a-858e-d4bfebfaa05d	t	\N	2026-04-22 16:50:37.628473	2
\.


--
-- TOC entry 3570 (class 0 OID 73728)
-- Dependencies: 239
-- Data for Name: express_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.express_sessions (sid, sess, expire) FROM stdin;
zkTi-3A1R911nOv-7rUJl9sqtzPK1JC1	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T18:04:06.611Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1,"userRole":"professional","professionalId":null,"userName":"Administrador","userEmail":"admin@neurometric.cl","userSpecialty":null}	2026-05-10 16:10:05
WOMxhZCQS5m3PFySjLkg0zpP93IBKnZc	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-30T01:18:13.029Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1,"userRole":"admin","professionalId":null,"userName":"Lic.Marquez","userEmail":"admin@neurometric.cl","userSpecialty":null}	2026-05-06 14:24:42
mm8pO3inPwE7bCGZla3WGgl8QWr7XwIo	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-30T19:30:35.697Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":5,"userRole":"professional","professionalId":null,"userName":"Jaqui","userEmail":"jaquimarque6@gmail.com","userSpecialty":"Fonoaudiología"}	2026-05-04 02:30:15
cYM0nn6pSF_f_H459inGqJDSdzfEhDHo	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T13:38:28.528Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1,"userRole":"admin","professionalId":null,"userName":"Lic.Marquez","userEmail":"admin@neurometric.cl","userSpecialty":null}	2026-05-09 13:38:37
eL_tJAYospoguD3_GPMkGsvOG2QCA1ot	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T15:29:53.974Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":9,"userRole":"admin","professionalId":null,"userName":"Admin","userEmail":"admin@neurometric.com","userSpecialty":null}	2026-05-09 15:29:54
GLHiudQzTdh0OBFntKMVo9wYCzl1rjFI	{"cookie":{"originalMaxAge":604800000,"expires":"2026-05-09T15:31:21.035Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":9,"userRole":"admin","professionalId":null,"userName":"Admin","userEmail":"admin@neurometric.com","userSpecialty":null}	2026-05-09 15:31:22
\.


--
-- TOC entry 3555 (class 0 OID 24621)
-- Dependencies: 224
-- Data for Name: goal_library; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goal_library (id, id_objetivo, nombre_objetivo, modulo, area, subarea, franja_etaria, definicion_operativa, actividades_clinicas, actividades_familia, meta_porcentaje, indicador_tipo, intentos_sugeridos, marco_conceptual, nivel_1_descripcion, nivel_2_descripcion, nivel_3_descripcion, recomendacion_clinica, informe_tecnico, created_at, area_clinica, nivel_dificultad, estado_banco, franja_etaria_min, franja_etaria_max, habilidades_relacionadas, prerequisitos, is_custom, created_by) FROM stdin;
530	EF-3-5-IMP-B-02	Terminar la actividad en curso antes de iniciar una nueva	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	3-5	El paciente completará la actividad asignada antes de pedir iniciar una nueva, evitando abandonarla a mitad, en el 80 % de las actividades de la sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-02 14:33:23.374159	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
531	SC-2-4-EMO-B-01	Reconocer expresiones faciales de las 4 emociones básicas	Comunicación Social	Comunicación Social	Reconocimiento emocional	3-5	El paciente señalará o nombrará la expresión facial correcta (feliz, triste, enojado, asustado) en fotografías de caras con un 80 % de aciertos en 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-02 14:33:23.374159	comunicación social	básico	activo	3	5	\N	\N	f	\N
138	HB-4-6-PRO-M-01	Usar patrones de entonación adecuados en oraciones declarativas e interrogativas	Habla	Habla	Prosodia	3-5	El paciente producirá oraciones declarativas e interrogativas con contorno entonativo diferenciado y reconocible por el oyente en el 80 % de las producciones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	intermedio	activo	3	5	\N	\N	f	\N
139	HB-6-8-ART-M-01	Producir el fonema /rr/ múltiple en distintas posiciones de palabra	Habla	Habla	Articulación	6-8	El paciente producirá el vibrante múltiple /rr/ en palabras y frases con un 80 % de precisión articulatoria en habla espontánea y dirigida.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	intermedio	activo	6	8	\N	\N	f	\N
444	NL-COMP-B-01	Comprender órdenes simples de 1 paso	Lenguaje	lenguaje	Comprensión	3-5	El paciente sigue instrucciones de una sola acción sin apoyo gestual o visual adicional, en al menos el 70% de los intentos.	\N	\N	70%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Presentar instrucciones en voz pausada. Variar el vocabulario paulatinamente. Registrar respuestas con y sin contexto.	\N	2026-04-09 18:00:08.803807	lenguaje	básico	activo	3	5	atención, comprensión auditiva, memoria a corto plazo	\N	f	\N
445	NL-COMP-B-02	Comprender órdenes de 2 pasos	Lenguaje	lenguaje	Comprensión	3-5	El paciente ejecuta correctamente dos acciones secuenciales incluidas en una sola instrucción, en al menos el 70% de los intentos.	\N	\N	70%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Iniciar con acciones cotidianas. Aumentar la distancia entre los dos pasos progresivamente. Evitar apoyos gestuales inicialmente.	\N	2026-04-09 18:00:08.803807	lenguaje	básico	activo	3	5	memoria de trabajo, secuenciación, atención sostenida	\N	f	\N
446	NL-COMP-B-03	Responder preguntas básicas (qué, quién)	Lenguaje	lenguaje	Comprensión	3-5	El paciente responde de forma pertinente a preguntas tipo 'qué' y 'quién' sobre imágenes o situaciones familiares, en al menos el 70% de los intentos.	\N	\N	70%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Usar láminas de alta frecuencia. Modelar respuestas cuando el paciente no responde. Registrar tipo de error (sin respuesta, respuesta incorrecta, aproximación).	\N	2026-04-09 18:00:08.803807	lenguaje	básico	activo	3	5	comprensión de interrogativas, vocabulario receptivo	\N	f	\N
447	NL-COMP-I-01	Identificar absurdos verbales simples	Lenguaje	lenguaje	Comprensión	6-8	El paciente identifica y explica por qué una oración o situación es absurda, en al menos el 75% de los ítems presentados.	\N	\N	75%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Comenzar con absurdos visuales antes de los verbales. Pedir que el paciente corrija el absurdo. Graduarte hacia situaciones más abstractas.	\N	2026-04-09 18:00:08.803807	lenguaje	intermedio	activo	6	8	razonamiento verbal, comprensión semántica, metalenguaje	\N	f	\N
448	NL-COMP-I-02	Comprender relaciones causa-efecto simples	Lenguaje	lenguaje	Comprensión	6-8	El paciente identifica la causa o el efecto de un evento presentado verbalmente o mediante imagen, en al menos el 75% de los intentos.	\N	\N	75%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Usar secuencias de 2 imágenes. Presentar conectores causales ('porque', 'entonces'). Trabajar con situaciones de la vida cotidiana del paciente.	\N	2026-04-09 18:00:08.803807	lenguaje	intermedio	activo	6	8	razonamiento inferencial, comprensión narrativa, conectores	\N	f	\N
449	NL-LEX-B-01	Ampliar vocabulario de objetos cotidianos	Lenguaje	lenguaje	Léxico y Semántica	3-5	El paciente nombra correctamente objetos de uso frecuente en categorías (hogar, ropa, comida, escuela), alcanzando al menos el 70% de aciertos.	\N	\N	70%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Introducir palabras en contexto funcional. Reforzar con objetos reales. Expandir con atributos (color, forma, uso) una vez logrado el nombre.	\N	2026-04-09 18:00:08.803807	lenguaje	básico	activo	3	5	vocabulario expresivo, denominación, memoria semántica	\N	f	\N
450	NL-LEX-B-02	Nombrar acciones frecuentes	Lenguaje	lenguaje	Léxico y Semántica	3-5	El paciente evoca verbos de alta frecuencia (comer, correr, dormir, jugar) al observar imágenes de acción, en al menos el 70% de los intentos.	\N	\N	70%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Usar láminas con escenas dinámicas. Modelar la acción físicamente. Combinar con rutinas de la sesión (muéstrame cómo saltas).	\N	2026-04-09 18:00:08.803807	lenguaje	básico	activo	3	5	vocabulario de acción, expresión verbal, semántica verbal	\N	f	\N
451	NL-LEX-I-01	Clasificar palabras por categorías semánticas	Lenguaje	lenguaje	Léxico y Semántica	6-8	El paciente agrupa correctamente palabras o imágenes en categorías semánticas (animales, frutas, muebles, vehículos), en al menos el 75% de los ensayos.	\N	\N	75%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Iniciar con categorías básicas y contrasting (animal vs. objeto). Aumentar número de categorías. Incluir ítems atípicos para evaluar flexibilidad semántica.	\N	2026-04-09 18:00:08.803807	lenguaje	intermedio	activo	6	8	organización semántica, vocabulario receptivo, razonamiento categorial	\N	f	\N
452	NL-LEX-I-02	Evocar palabras a partir de una categoría	Lenguaje	lenguaje	Léxico y Semántica	6-8	El paciente produce al menos 5 palabras pertenecientes a una categoría dada en 60 segundos (fluidez verbal semántica), en al menos el 75% de los ensayos.	\N	\N	75%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Usar categorías de alta familiaridad primero (animales, frutas). Cronometrar y registrar número y variedad de respuestas. Evitar repetir la misma palabra como correcta.	\N	2026-04-09 18:00:08.803807	lenguaje	intermedio	activo	6	8	fluidez verbal, recuperación léxica, memoria semántica	\N	f	\N
453	NL-LEX-I-03	Describir objetos por atributos (color, tamaño, función)	Lenguaje	lenguaje	Léxico y Semántica	6-8	El paciente describe un objeto o imagen incluyendo al menos 3 atributos (nombre, función, color/tamaño o pertenencia a categoría), en al menos el 75% de los intentos.	\N	\N	75%	porcentaje de respuestas correctas	10	\N	\N	\N	\N	Modelar descripciones completas primero. Usar apoyo visual (tabla de atributos). Registrar cuántos atributos incluye espontáneamente vs. con pistas.	\N	2026-04-09 18:00:08.803807	lenguaje	intermedio	activo	6	8	elaboración semántica, vocabulario de atributos, expresión verbal organizada	\N	f	\N
454	NL-0-0-GEN-B-01	Objetivo personalizado de prueba	Neurolengua	lenguaje	\N	\N	Describe el comportamiento observable y medible esperado para validar el objetivo personalizado de prueba.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 13:57:09.16114	lenguaje	básico	activo	\N	\N	\N	\N	t	6
458	NL-2-3-GEN-B-01	demo	Neurolengua	lenguaje	\N	2-3	demo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:38:02.555333	lenguaje	básico	activo	2	3	\N	\N	t	1
491	NL-0-0-GEN-B-05	Objetivo solo de sesión	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:46:53.29734	lenguaje	básico	activo	\N	\N	\N	\N	t	1
498	CG-0-2-AT-B-01	demo1	Neurolengua	cognición	Atención	0-2	demo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 00:14:09.155276	cognición	básico	activo	0	2	\N	\N	t	5
500	VOZ-001	Coordinar soplo y emisión vocal en vocalizaciones simples	Habla	Habla	Voz	3-5	El/la paciente coordinará el soplo y la emisión de voz produciendo vocales o sílabas sostenidas por al menos 3 segundos con tono continuo y sin quiebres en 4 de 5 intentos.	Soplo con paja en agua. Emisión de vocales con apoyo de espirómetro visual. Cantos simples con notas largas.	Practicar 5 minutos de emisiones vocales largas ("aaaaa") antes de dormir. Canciones lentas y suaves.	4 de 5 intentos exitosos por sesión	Duración de emisión sostenida	10 producciones por sesión	\N	\N	\N	\N	Trabajar en postura correcta. Usar velas, molinetes o burbujas como apoyo visual del soplo. Iniciar con vocales abiertas (/a/).	\N	2026-04-23 19:03:57.605054	habla	básico	activo	3	5	\N	\N	f	\N
501	VOZ-002	Coordinar respiración costo-diafragmática con emisión vocal en frases	Habla	Habla	Voz	6-8	El/la paciente realizará inspiración costo-diafragmática y producirá frases de 5-8 palabras en una sola espiración sin tensión cervical ni quiebres vocales en el 75% de las producciones.	Lectura en voz alta de frases marcando la respiración. Ejercicio de 'frase en una respiración'. Cantos lentos con frases cortas.	Leer en voz alta 10 minutos diarios con pausa respiratoria consciente antes de cada frase.	75% de frases producidas sin tensión observable	Calidad de coordinación fono-respiratoria	15 frases por sesión	\N	\N	\N	\N	Usar espejo para observar movimiento torácico. Evitar frases que exijan mucho volumen. Reforzar la postura sedente erguida.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	6	8	\N	\N	f	\N
140	HB-6-8-FON-M-01	Aplicar reglas de acentuación en palabras de más de tres sílabas	Habla	Habla	Prosodia léxica	6-8	El paciente acentuará correctamente palabras esdrújulas y sobresdrújulas al leer en voz alta, con un 80 % de precisión en una muestra de 30 palabras.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	intermedio	activo	6	8	\N	\N	f	\N
141	HB-6-8-FLU-M-01	Reducir disfluencias en situaciones de presión comunicativa	Habla	Habla	Fluidez	6-8	El paciente mantendrá menos de 5 disfluencias por cada 100 sílabas en conversación con el terapeuta aplicando técnicas de modificación del tartamudeo.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	intermedio	activo	6	8	\N	\N	f	\N
455	NL-0-0-GEN-B-02	Objetivo personalizado TEST	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 14:00:41.273127	lenguaje	básico	activo	\N	\N	\N	\N	t	6
492	VO-3-5-GEN-B-01	demo2	Neurolengua	voz	\N	3-5	demo2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:48:28.606365	voz	básico	activo	3	5	\N	\N	t	1
499	NL-0-0-GEN-B-09	Objetivo personalizado QA 1776644712171	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-20 00:25:15.296383	lenguaje	básico	sesion	\N	\N	\N	\N	t	1
502	VOZ-003	Sostener coordinación fono-respiratoria durante lectura en voz alta	Habla	Habla	Voz	9-12	El/la paciente leerá en voz alta durante 3 minutos continuos usando respiración costo-diafragmática, sin signos de tensión vocal, carraspeo ni fatiga vocal observable.	Lectura de texto graduado con marcas de pausa respiratoria. Feedback de audio para automonitoreo. Lectura coral antes de individual.	Leer en voz alta 5 minutos diarios. Identificar si la voz suena 'cansada' y parar a hidratarse.	3 minutos sin signos de fatiga en 2 de 3 sesiones	Duración sin fatiga vocal	Segmentos de lectura de 3 minutos	\N	\N	\N	\N	Aumentar gradualmente la duración. Registrar signos de fatiga (ronquera, carraspeo, tensión). Trabajar con textos de nivel apropiado.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	9	12	\N	\N	f	\N
503	VOZ-004	Identificar y reducir el esfuerzo glótico en emisiones vocales simples	Habla	Habla	Voz	6-8	El/la paciente identificará la diferencia entre voz tensa y voz fácil y producirá sílabas y palabras con voz fácil (sin tensión laríngea perceptible) en el 70% de las producciones elicitadas.	Modelado de voz fácil vs tensa con contraste auditivo. Producción con bocostezos. Vocalizaciones suaves con /h/ inicial.	Modelar voz suave en casa. Evitar competir con ruido ambiental. Practicar "hablar bajito" como juego.	70% de producciones con voz no tensa	Calidad vocal perceptual (esfuerzo)	20 producciones por sesión	\N	\N	\N	\N	Usar analogías: "voz de dormido" vs "voz de enojado". Modelar el contraste. Evitar gritar como reforzador.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
504	VOZ-005	Producir frases con técnica de flujo de voz fácil (easy voice onset)	Habla	Habla	Voz	9-12	El/la paciente usará la técnica de inicio vocal fácil (ataque suave, flujo aéreo previo a la voz) en frases de conversación dirigida, logrando ausencia de esfuerzo glótico en al menos 3 de 4 intentos.	Ejercicio de "hhhh-a" para inicio fácil. Frases cortas comenzando con vocales. Lectura de diálogos con consciencia del inicio vocal.	Practicar el saludo con voz suave cada mañana. Evitar hablar sobre ruido de fondo (TV, música).	75% de inicios vocales suaves en frases dirigidas	Tipo de inicio vocal	20 frases por sesión	\N	\N	\N	\N	Enseñar el concepto de "flujo de aire primero, luego la voz". Usar biofeedback de voz si disponible. Extender al habla espontánea gradualmente.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
505	VOZ-006	Generalizar el uso de la voz sin esfuerzo en conversación espontánea	Habla	Habla	Voz	13-16	El/la paciente usará de forma espontánea la voz sin esfuerzo en al menos 3 contextos comunicativos distintos (sesión, hogar, sala de clases) con feedback positivo del entorno y sin signos de disfonía funcional.	Juego de rol en distintos contextos (entrevista, patio, clase). Grabación y análisis de voz espontánea. Retroalimentación de audio.	Observar y reportar episodios de voz tensa. Recordar pausas vocales. Ambiente tranquilo en casa para comunicación.	Voz no tensa en 80% de conversaciones autorreportadas	Generalización en contextos naturales	Registro semanal de 3 contextos diferentes	\N	\N	\N	\N	Usar autorregistro (diario de voz). Identificar situaciones de riesgo (estrés, ruido). Coordinar con docentes si hay uso vocal intenso en el aula.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	13	16	\N	\N	f	\N
506	VOZ-007	Modular la intensidad vocal según el contexto comunicativo	Habla	Habla	Voz	6-8	El/la paciente diferenciará y producirá al menos tres niveles de intensidad vocal (susurro, conversacional, proyectada) de forma apropiada según la situación comunicativa presentada, en 4 de 5 contextos elicitados.	Juego de 'semáforo vocal' (rojo=susurro, amarillo=conversacional, verde=proyectada). Dramatización de situaciones. Juego de maestro-alumno.	Jugar en casa a los distintos niveles de voz. Notar cuándo la situación pide voz fuerte vs. bajita.	4 de 5 contextos con intensidad apropiada	Adecuación de intensidad al contexto	10 situaciones de modulación por sesión	\N	\N	\N	\N	Usar juego de roles para distintos contextos. Evitar el uso de voz de susurro prolongado (afona). Enseñar la diferencia entre "voz proyectada" y "gritar".	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
507	VOZ-008	Ajustar tono e intensidad vocal en presentaciones orales	Habla	Habla	Voz	9-12	El/la paciente ajustará el tono e intensidad de la voz durante presentaciones orales de al menos 2 minutos, manteniendo proyección adecuada sin tensión laríngea en 3 de 4 presentaciones evaluadas.	Simulación de exposición oral con audiencia progresiva. Ejercicios de proyección contra pared. Lectura expresiva de texto narrativo.	Practicar en casa con audiencia familiar. Grabarse con el teléfono y escuchar la propia voz.	75% de presentaciones con proyección adecuada y sin tensión	Proyección vocal en presentación	2 presentaciones de 2 minutos por sesión	\N	\N	\N	\N	Trabajar postura, respiración y proyección como unidad. Usar grabación de audio para automonitoreo. Graduar la audiencia (terapeuta → grupo pequeño).	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
508	VOZ-009	Sostener intensidad vocal adecuada durante exposición formal de 5 minutos	Habla	Habla	Voz	13-16	El/la paciente mantendrá intensidad vocal proyectada y tono estable durante exposiciones formales de 5 minutos ante grupo de al menos 3 personas, sin signos de fatiga ni descenso de intensidad hacia el final.	Exposición oral simulada con cronómetro y grabación. Análisis de audio para detectar caída de intensidad. Entrenamiento de cierre potente.	Exponer en casa ante familia durante 5 minutos. Pedir retroalimentación sobre si se escucha bien desde el otro extremo del cuarto.	Intensidad sostenida en 80% del tiempo de exposición	Estabilidad de intensidad en discurso prolongado	1 exposición de 5 minutos por sesión	\N	\N	\N	\N	Controlar hidratación antes de exposición. Planificar pausas estratégicas. Evitar hablar en espacios con mala acústica sin apoyo de micrófono.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	13	16	\N	\N	f	\N
29	NL-007	Clasificar objetos en categorías semánticas básicas	Neurolengua	Léxico	Categorías semánticas	3-5	El/la paciente agrupará objetos en categorías semánticas (animales, alimentos, ropa, muebles, transportes) señalando o nombrando al menos 4 elementos por categoría.	Juegos de clasificación con tarjetas. Identificar el intruso en una categoría. Dominó temático. Asociación de imágenes por categorías.	Juego de 'busca todas las cosas de comer'. Ordenar la compra por categorías. Clasificar juguetes por tipo. Mirar libros temáticos juntos.	4+ ítems por categoría en el 80% de las sesiones	Clasificación y denominación	3 categorías por sesión	\N	\N	\N	\N	Comenzar con categorías de alta frecuencia (alimentos, animales). Usar objetos reales antes que imágenes.	\N	2026-03-13 19:42:44.4543	lenguaje	básico	activo	3	5	Memoria semántica, atención selectiva, razonamiento por similitud	Vocabulario expresivo de 50+ palabras (NL-001)	f	\N
456	NL-0-0-GEN-B-03	Objetivo de prueba paciente	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 14:18:37.081265	lenguaje	básico	activo	\N	\N	\N	\N	t	1
493	NL-0-0-GEN-B-06	Objetivo sesión solamente	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:49:39.959564	lenguaje	básico	sesion	\N	\N	\N	\N	t	1
509	VOZ-010	Identificar conductas vocales de riesgo (gritar, carraspear, susurrar)	Habla	Habla	Higiene vocal	3-5	El/la paciente identificará al menos 3 conductas que hacen daño a la voz (gritar, carraspear, toser sin necesidad) y 3 conductas que cuidan la voz (hidratarse, descansar la voz), mediante imágenes o juego de roles.	Juego de clasificación de tarjetas vocales. Rol de 'doctor de la voz'. Cuento de la voz cansada.	Colgar en casa la lista de normas de higiene vocal en un lugar visible. Modelar conductas vocales saludables.	3 de 3 conductas negativas y 3 de 3 positivas identificadas	Reconocimiento de conductas vocales	Una actividad de identificación por sesión	\N	\N	\N	\N	Usar material visual (tarjetas "bueno para la voz" / "malo para la voz"). Involucrar a los padres en el refuerzo. Evitar el uso de susurro como alternativa.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	3	5	\N	\N	f	\N
510	VOZ-011	Aplicar normas de higiene vocal en el contexto escolar	Habla	Habla	Higiene vocal	6-8	El/la paciente aplicará al menos 4 normas de higiene vocal (hidratarse, no gritar en recreo, no imitar voces, hablar a distancia adecuada) en el contexto escolar, confirmado por autorreporte y reporte docente en 3 semanas consecutivas.	Elaboración de "carnet de higiene vocal". Entrenamiento en sustitución de carraspeo por deglución. Revisión de diario vocal semanal.	Llevar botella de agua al colegio. Recordar al llegar a casa si hubo situaciones difíciles para la voz.	4 normas aplicadas en al menos 3 semanas seguidas	Adherencia a higiene vocal	Revisión semanal con el paciente	\N	\N	\N	\N	Elaborar tarjeta de higiene vocal personalizada. Coordinar con el profesor/a jefatura. Reforzar positivamente cada semana que cumple.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
511	VOZ-012	Implementar plan de higiene vocal con hidratación y pausas vocales	Habla	Habla	Higiene vocal	9-12	El/la paciente implementará un plan de higiene vocal personalizado que incluya: hidratación de 1.5 litros diarios, 10 min de silencio vocal diario y eliminación de al menos 2 conductas nocivas, sostenido por 4 semanas.	Diseño del plan personalizado con el paciente. Monitoreo de diario vocal. Sesiones breves de relajación laríngea (bostezos, masajes cervicales).	Apoyar el diario de hidratación. Crear rutina de silencio vocal vespertino. Remarcar cuando la voz suena más descansada.	Plan cumplido en 80% de los días en 4 semanas	Adherencia a plan de higiene vocal	Revisión quincenal con el paciente	\N	\N	\N	\N	Usar diario o app para registrar hidratación. Identificar momentos de mayor esfuerzo vocal (recreo, clases con participación). Reforzar con voz sana como evidencia.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
512	VOZ-013	Proyectar la voz en el aula sin tensión laríngea	Habla	Habla	Voz	6-8	El/la paciente proyectará la voz para ser escuchado/a a una distancia de 4 metros sin elevar tensión laríngea ni gritar, en situaciones de habla simuladas en sesión y en reporte del docente.	Ejercicio de "hablar a la pared" midiendo distancia. Juego de eco vocal. Presentaciones breves en sala grande.	Practicar hablar desde otro cuarto sin gritar. Notar si la voz se esfuerza.	Proyección adecuada reportada en 3 de 4 observaciones	Calidad de proyección vocal	5 situaciones de proyección por sesión	\N	\N	\N	\N	Enseñar a usar resonancia anterior (no fuerza laríngea) para proyectar. Comparar con hablar "desde el pecho" vs "desde la garganta".	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
513	VOZ-014	Usar la voz de forma eficiente en presentaciones orales breves	Habla	Habla	Voz	9-12	El/la paciente realizará presentaciones orales de 3 minutos con voz proyectada, ritmo adecuado y sin signos de tensión ni fatiga vocal, en al menos 2 contextos de presentación distintos.	Simulación de presentación con retroalimentación de audio. Entrenamiento en pausa estratégica. Exposición con audiencia creciente.	Practicar en casa con texto corto. Escuchar la grabación y comentar si la voz suena tranquila y clara.	2 presentaciones sin tensión vocal observable	Calidad vocal en presentación	2 presentaciones por sesión	\N	\N	\N	\N	Ensayar con grabación. Planificar pausas respiratorias. Coordinar con docentes para presentaciones graduadas en sala de clases.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
514	VOZ-015	Manejar la voz eficientemente en exposiciones académicas formales	Habla	Habla	Voz	13-16	El/la paciente realizará exposiciones académicas de 5-7 minutos con voz proyectada, tono estable, sin tensión laríngea ni fatiga al finalizar, en al menos 3 instancias evaluadas (sesión, ensayo en colegio, presentación real).	Exposición simulada con grabación y análisis conjunto. Role play de entrevista y debate. Ensayo de presentación de certamen.	Ensayar en casa frente a familia. Revisar grabación con apoyo familiar. Identificar párrafos de mayor esfuerzo y modificarlos.	3 exposiciones con calidad vocal sostenida	Eficiencia vocal en contexto académico formal	1 exposición de 5 minutos por sesión	\N	\N	\N	\N	Incorporar técnicas de manejo del estrés vocal. Coordinar con el profesor de lenguaje o biología para exposiciones reales. Usar biofeedback de frecuencia fundamental si disponible.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	13	16	\N	\N	f	\N
515	FL-001	Identificar y reducir repeticiones de sílabas en palabras simples	Habla	Habla	Fluidez	3-5	El/la paciente reducirá las repeticiones de sílabas a menos de 2 por 100 palabras durante actividades de denominación y frases cortas en 3 sesiones consecutivas, usando el modelo del habla lenta del terapeuta.	Juego de narración de imágenes con habla lenta modelada. Actividades de denominación con turnos tranquilos. Canciones y rimas.	Bajar el ritmo propio al hablar con el niño/a. No completar sus palabras. Crear momentos de conversación tranquila sin apuro.	Menos de 2 repeticiones por 100 palabras	Frecuencia de repeticiones por 100 palabras	Muestra de 100 palabras por sesión	\N	\N	\N	\N	Usar el enfoque de Lidcombe (refuerzo de fluidez, corrección suave). No interrumpir ni completar las palabras. Ambiente de baja presión comunicativa.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	3	5	\N	\N	f	\N
516	FL-002	Reducir bloqueos vocales con técnica de inicio suave en frases	Habla	Habla	Fluidez	6-8	El/la paciente usará la técnica de inicio suave (easy onset) para superar bloqueos vocales, logrando producir frases con menos de 1 bloqueo por minuto en contextos de habla dirigida.	Entrenamiento en inicio suave con vocales. Lectura en voz alta de frases marcadas. Diálogo dirigido con apoyo.	Modelar habla lenta en casa. No mostrar impaciencia. Mantener contacto visual tranquilo.	Menos de 1 bloqueo por minuto en habla dirigida	Frecuencia de bloqueos por minuto	5 minutos de habla dirigida por sesión	\N	\N	\N	\N	Enseñar el inicio suave de forma explícita y práctica. Reforzar los intentos fluidos, no solo los resultados. No anticipar palabras difíciles.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	6	8	\N	\N	f	\N
457	NL-0-0-GEN-B-04	Objetivo para esta sesión	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 14:19:16.894596	lenguaje	básico	activo	\N	\N	\N	\N	t	1
494	HB-3-5-GEN-B-01	demo 3	Neurolengua	habla	\N	3-5	demo3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:50:35.697568	habla	básico	activo	3	5	\N	\N	t	1
517	FL-003	Mantener fluidez en conversación reduciendo bloqueos y prolongaciones	Habla	Habla	Fluidez	9-12	El/la paciente mantendrá conversación de 5 minutos con menos de 3 disfluencias por minuto (combinando bloqueos, prolongaciones y repeticiones) usando las estrategias aprendidas de forma autónoma.	Conversación espontánea grabada con análisis posterior. Debate estructurado de baja presión. Juego de roles en situaciones cotidianas.	Tener al menos una conversación de 10 minutos diarios sin apuro. Celebrar días de buena fluidez sin exagerar.	Menos de 3 disfluencias por minuto en conversación de 5 min	Frecuencia total de disfluencias por minuto	Muestra de 5 minutos de conversación por sesión	\N	\N	\N	\N	Registrar el tipo y frecuencia de disfluencias. Reforzar el uso autónomo de estrategias. Graduar la complejidad del interlocutor.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	9	12	\N	\N	f	\N
518	FL-004	Producir oraciones cortas de 4-5 palabras con fluidez sostenida	Habla	Habla	Fluidez	6-8	El/la paciente producirá oraciones de 4-5 palabras en actividades dirigidas con fluidez (sin repeticiones, bloqueos ni prolongaciones) en al menos 8 de 10 oraciones consecutivas en sesión.	Descripción de láminas con oraciones cortas. Juego de 'la historia encadenada' con frases de 4 palabras. Preguntas de respuesta corta.	Preguntas de respuesta corta en casa (¿cómo fue el día? → respuesta en 1 oración). Habla lenta modelada.	8 de 10 oraciones sin disfluencias en contexto dirigido	Oraciones fluidas consecutivas	20 oraciones dirigidas por sesión	\N	\N	\N	\N	Usar imágenes narrativas para elicitar oraciones. Modelar habla lenta antes de cada turno. No progresar a frases más largas hasta consolidar este nivel.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
519	FL-005	Mantener fluidez en habla espontánea durante al menos 3 minutos	Habla	Habla	Fluidez	9-12	El/la paciente sostendrá habla espontánea durante 3 minutos con menos de 5 disfluencias totales, usando las estrategias de fluidez aprendidas de forma autónoma en contexto de baja presión.	Narración libre de historia favorita o evento reciente. Descripción de lámina compleja. Monólogo sobre tema de interés.	Pedir al niño/a que cuente algo de su día en detalle. Escuchar sin interrumpir. Celebrar la fluidez al finalizar.	3 minutos con menos de 5 disfluencias en 2 sesiones	Duración de habla fluida espontánea	Segmento de habla espontánea de 3 minutos por sesión	\N	\N	\N	\N	Iniciar con temas de alta motivación para el paciente. Registrar disfluencias sin interrumpir. Proveer feedback positivo al finalizar.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
520	FL-006	Generalizar fluidez en contextos comunicativos de alta demanda	Habla	Habla	Fluidez	13-16	El/la paciente mantendrá una tasa de disfluencias menor a 3 por minuto en contextos de alta demanda comunicativa (exposición oral, respuesta en clase, conversación grupal), confirmado en al menos 3 contextos distintos.	Role play de examen oral. Debate grupal. Llamada telefónica simulada. Exposición ante grupo pequeño.	Acompañar al paciente en situaciones sociales desafiantes. Normalizar las disfluencias sin dramatizar. Reforzar el intento, no el resultado.	Menos de 3 disfluencias por minuto en 3 contextos de alta demanda	Tasa de disfluencias en contextos exigentes	1 situación de alta demanda por sesión	\N	\N	\N	\N	Usar exposición gradual a situaciones de presión. Trabajar cogniciones negativas sobre el habla. Coordinación con docentes para situaciones escolares.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	13	16	\N	\N	f	\N
521	FL-007	Aplicar el inicio suave (easy onset) en palabras que comienzan con vocal	Habla	Habla	Fluidez	6-8	El/la paciente aplicará la técnica de inicio suave (ataque vocal gradual, sin golpe glótico) en palabras que inician con vocal, logrando producción fluida en al menos 8 de 10 palabras en contexto controlado.	Lista de palabras con inicial vocálica. Repetición con modelo. Dominó de palabras. Lectura de frases con marcado de vocales iniciales.	Practicar lista de 10 palabras con inicio suave cada día. Modelar el mismo inicio en la propia habla.	8 de 10 palabras con inicio suave en contexto controlado	Tipo de inicio vocal	20 palabras con inicial vocálica por sesión	\N	\N	\N	\N	Enseñar el contraste entre inicio duro (golpe glótico) e inicio suave. Usar analogías ("la voz que acaricia"). No corregir en habla espontánea inicialmente.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
522	FL-008	Usar el inicio suave de forma consistente en frases y discurso	Habla	Habla	Fluidez	9-12	El/la paciente usará el inicio suave en más del 80% de las palabras con potencial de bloqueo durante actividades de habla semi-espontánea (descripción, narración), identificadas mediante análisis de muestra de habla.	Narración de historia con palabras objetivo subrayadas. Descripción de imágenes complejas. Conversación temática estructurada.	Escuchar al niño/a durante narraciones en casa y anotar palabras difíciles para trabajar en sesión.	80% de inicios suaves en habla semi-espontánea	Porcentaje de inicios suaves en habla semi-espontánea	Muestra de 3 minutos de habla semi-espontánea por sesión	\N	\N	\N	\N	Marcar palabras difíciles antes de hablar y planificar inicio suave. Usar texto con subrayado de palabras objetivo. Extender gradualmente al habla espontánea.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
523	FL-009	Integrar el inicio suave como estrategia automática en conversación	Habla	Habla	Fluidez	13-16	El/la paciente usará el inicio suave de forma automática (sin instrucción externa) en al menos el 80% de los inicios de palabra en conversación espontánea, evaluado mediante grabación en 2 contextos distintos.	Conversación libre grabada con análisis de audio. Debate de tema de interés. Entrevista simulada.	Conversaciones en casa sin corrección. Remarcar momentos de habla especialmente fluida.	80% de inicios suaves en conversación espontánea	Automatización de inicio suave en conversación	Grabación de conversación espontánea de 5 minutos por sesión	\N	\N	\N	\N	Analizar grabaciones conjuntamente con el paciente. Identificar situaciones de regresión y estrategias de recuperación. Reforzar la percepción de la propia fluidez.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	13	16	\N	\N	f	\N
23	NL-001	Ampliar el vocabulario expresivo en contexto funcional	Neurolengua	Lenguaje Expresivo	Léxico	3-5	El/la paciente incrementará su léxico expresivo nominando correctamente objetos, personas y acciones de su entorno cotidiano, en situaciones espontáneas y estructuradas.	Juegos de denominación con tarjetas temáticas. Rutinas de nombrar objetos del entorno clínico. Juego simbólico con vocabulario dirigido. Láminas de categorías semánticas.	Nombrar objetos del hogar durante las comidas. Nombrar ropa al vestirse. Leer cuentos con imágenes señalando y nombrando. Juego del 'qué es esto' durante el baño.	80% en 4 de 5 oportunidades	Denominación espontánea	10 por sesión	\N	\N	\N	\N	Contextualizar el vocabulario en rutinas del hogar. Evitar correcciones directas; modelar la forma correcta.	\N	2026-03-13 19:42:44.4543	lenguaje	básico	activo	3	5	Atención compartida, memoria semántica, imitación	Comprensión de al menos 50 palabras, intención comunicativa presente	f	\N
495	NL-0-0-GEN-B-07	Objetivo solo sesión	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:53:47.887927	lenguaje	básico	sesion	\N	\N	\N	\N	t	1
524	FL-010	Imitar patrones de ritmo y prosodia en frases cortas con apoyo visual	Habla	Habla	Fluidez	3-5	El/la paciente imitará el patrón rítmico de frases cortas de 3-4 palabras modeladas por el terapeuta con apoyo de palmadas, golpes de mesa o pictogramas, logrando reproducción correcta en 4 de 5 intentos.	Canciones con marcado rítmico. Rimas con palmadas. Habla rítmica con metrónomo visual (app).	Cantar canciones con marcado rítmico. Jugar a palmear el ritmo de palabras y frases en casa.	4 de 5 imitaciones correctas	Imitación de patrón rítmico	10 frases con imitación de ritmo por sesión	\N	\N	\N	\N	Usar palmadas o golpes suaves para marcar el ritmo. Canciones y rimas son el mejor punto de entrada. Modelar exagerando ligeramente el ritmo al inicio.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	3	5	\N	\N	f	\N
525	FL-011	Usar habla rítmica para mejorar fluidez en lectura en voz alta	Habla	Habla	Fluidez	6-8	El/la paciente leerá textos de nivel apropiado en voz alta usando habla rítmica (syllable-timed speech) con metrónomo o palmadas, logrando fluidez sin disfluencias en al menos 80% de las palabras leídas.	Lectura rítmica con metrónomo. Lectura coral con el terapeuta. Grabación y escucha de la propia lectura.	Leer en voz alta 10 minutos con ritmo marcado por palmadas. Escuchar la grabación juntos.	80% de palabras leídas sin disfluencia bajo habla rítmica	Fluidez en lectura rítmica	3 pasajes de lectura rítmica de 1 minuto por sesión	\N	\N	\N	\N	Usar metrónomo app a 60-70 bpm. Progresar del texto simple a texto complejo. Generar automatismo antes de retirar el soporte rítmico.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	6	8	\N	\N	f	\N
526	FL-012	Regular la velocidad del habla para favorecer fluidez en discurso	Habla	Habla	Fluidez	9-12	El/la paciente regulará su velocidad del habla a un ritmo de entre 110-140 palabras por minuto en discurso estructurado (narración, descripción), reduciendo la frecuencia de disfluencias en al menos un 40% respecto al baseline.	Narración de cuento con cronómetro. Grabación y análisis de velocidad. Reducción progresiva de velocidad con metrónomo.	Modelar habla lenta en casa. Pedir al paciente que cuente algo despacio y escuchar sin prisa.	110-140 ppm con reducción de disfluencias del 40%	Velocidad del habla (palabras/minuto)	2 muestras de habla de 2 minutos por sesión	\N	\N	\N	\N	Registrar velocidad basal antes de intervenir. Usar metrónomos app o feedback de habla en tiempo real. Entrenar la percepción de 'habla cómoda'.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
527	FL-013	Identificar situaciones comunicativas que generan ansiedad	Habla	Habla	Fluidez	6-8	El/la paciente identificará y nombrará al menos 3 situaciones que le generan más dificultad para hablar (responder en clase, hablar por teléfono, conocer gente nueva) y las clasificará según su nivel de dificultad percibida.	Mapa de situaciones fáciles/difíciles con tarjetas. Cuento de personaje que tartamudea y cómo lo maneja. Escala subjetiva de dificultad.	Conversar en casa sobre cómo se sintió en distintas situaciones de habla sin juzgar. Validar la emoción ("es normal sentir eso").	3 situaciones identificadas y clasificadas correctamente	Autoconciencia de situaciones difíciles	Una actividad de mapeo de situaciones por sesión	\N	\N	\N	\N	Usar escala visual de 1 a 5 (cara feliz a cara preocupada). Validar los sentimientos sin minimizarlos. Evitar forzar exposición a situaciones de alta ansiedad al inicio.	\N	2026-04-23 19:03:57.605054	habla	básico	activo	6	8	\N	\N	f	\N
528	FL-014	Aplicar técnicas de relajación y respiración antes de situaciones desafiantes	Habla	Habla	Fluidez	9-12	El/la paciente aplicará de forma autónoma al menos 2 técnicas de regulación (respiración diafragmática, relajación muscular progresiva breve) antes de situaciones comunicativas identificadas como difíciles, reportando reducción de tensión en escala de 7 a ≤4.	Entrenamiento en respiración 4-7-8. Técnica de relajación breve (body scan de 3 minutos). Role play de situación difícil con preparación regulatoria previa.	Practicar la respiración diafragmática en casa 5 minutos diarios. Repasar la rutina de relajación antes de situaciones que el paciente identifique como difíciles.	Reducción de tensión de 7 a 4 o menos en escala 1-10	Reducción de ansiedad autorreportada	2 situaciones de práctica de regulación por sesión	\N	\N	\N	\N	Enseñar las técnicas de forma explícita y practicarlas en sesión antes de situaciones reales. Usar autorregistro de ansiedad pre y post. Coordinar con psicólogo si la ansiedad es severa.	\N	2026-04-23 19:03:57.605054	habla	intermedio	activo	9	12	\N	\N	f	\N
529	FL-015	Reducir ansiedad comunicativa mediante exposición gradual a situaciones de habla	Habla	Habla	Fluidez	13-16	El/la paciente completará una jerarquía de al menos 5 situaciones comunicativas de ansiedad creciente (de ≤3 a ≥7 en escala de 1-10), participando activamente en cada una con apoyo decreciente, reportando reducción de ansiedad en al menos 3 niveles de la jerarquía.	Construcción colaborativa de jerarquía de exposición. Role play de cada nivel. Debriefing post-exposición con registro de ansiedad pre/post.	Acompañar en exposiciones externas si el paciente lo acepta. Reforzar el valor del intento ("lo intentaste y eso es lo que importa"). No anticipar fracasos.	3 de 5 situaciones de jerarquía completadas con reducción de ansiedad	Progreso en jerarquía de exposición	1 exposición por semana (en y fuera de sesión)	\N	\N	\N	\N	Construir la jerarquía colaborativamente con el paciente. No forzar el avance. Coordinar con psicólogo. Celebrar cada exposición completada, independiente del resultado de fluidez.	\N	2026-04-23 19:03:57.605054	habla	avanzado	activo	13	16	\N	\N	f	\N
31	HA-001	Producir fonemas oclusivos y nasales en posición inicial de palabra	Neurolengua	Habla	Articulación	3-5	El/la paciente producirá los fonemas /p/, /b/, /t/, /d/, /k/, /g/, /m/, /n/ en posición inicial de sílaba en palabras aisladas y en frases cortas con un 80% de precisión.	Ejercicios de imitación de sílabas. Juego de denominación con palabras que inician con el fonema objetivo. Canciones y rimas. Pares mínimos.	Leer libros con aliteración. Cantar canciones con el sonido objetivo. Nombrar imágenes del fonema trabajado cada día.	80% de producción correcta en palabras aisladas	Producción articulatoria	20 producciones por sesión	\N	\N	\N	\N	No corregir en habla espontánea; reforzar en actividades dirigidas. Verificar audición normal.	\N	2026-03-13 19:42:44.4543	habla	básico	activo	3	5	Discriminación auditiva (HA-005), praxis oromotora (MO-002), imitación	Discriminación auditiva de fonemas trabajados, función motora oral adecuada	f	\N
496	NL-0-0-GEN-B-08	Objetivo para el banco	Neurolengua	lenguaje	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 00:54:06.634869	lenguaje	básico	activo	\N	\N	\N	\N	t	1
40	PR-005	Adaptar el registro comunicativo al interlocutor y contexto	Neurolengua	Pragmática	Adaptación discursiva	9-12	El/la paciente ajustará su lenguaje (vocabulario, tono, formalidad) según las características del interlocutor (adulto/niño, conocido/desconocido) y el contexto (formal/informal).	Role-play con diferentes interlocutores. Análisis de situaciones comunicativas. Comparar formas de hablar en distintos contextos. Grabación y autoevaluación.	Modelar diferencias de registro en la vida diaria. Señalar cómo hablan los personajes en películas según con quién hablan.	Ajuste apropiado en 3 de 4 situaciones de role-play	Role-play y autoevaluación	4 situaciones contrastadas por sesión	\N	\N	\N	\N	Trabajar con situaciones reales del entorno del paciente. Reforzar autoevaluación.	\N	2026-03-13 19:42:44.4543	pragmática	avanzado	activo	9	12	Teoría de la mente, habilidades conversacionales (PR-003), metacognición	Habilidades conversacionales básicas (PR-003), lenguaje fluido	f	\N
42	MO-002	Realizar praxis orofaciales básicas bajo consigna verbal e imitación	Neurolengua	Motricidad Orofacial	Praxis	3-5	El/la paciente ejecutará al menos 6 praxis orofaciales básicas (abrir boca, sacar lengua, labios juntos, sonrisa, fruncir labios, soplar) ante consigna verbal y/o modelado.	Imitación frente al espejo. Juego de 'caras y gestos'. Uso de soplo lúdico. Modelado de praxis en secuencia. Fotos de referencia para praxis.	Juego del espejo en casa. Soplar velas o molinetes. Imitar caras de animales o personajes. Juegos de soplo con burbujas.	6 de 8 praxis correctas en 3 sesiones consecutivas	Evaluación de praxis imitativa	5 repeticiones de cada praxis	\N	\N	\N	\N	Comenzar con imitación visual antes de consigna verbal. Incluir praxis en contextos lúdicos.	\N	2026-03-13 19:42:44.4543	motricidad orofacial	básico	activo	3	5	Tono muscular (MO-001), imitación motora, atención	Tono mínimo adecuado para movilidad (MO-001)	f	\N
497	CG-0-2-GEN-B-01	demo 4	Neurolengua	cognición	\N	0-2	demo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 01:00:42.658522	cognición	básico	activo	0	2	\N	\N	t	1
55	ET-002	Imitar gestos y vocalizaciones del adulto	Neurolengua	Estimulación Temprana	Imitación	0-2	El/la bebé imitará al menos 3 gestos faciales simples (abrir boca, sacar lengua, sonreír) y 3 vocalizaciones (/a/, /m/, /b/) en respuesta al modelado del adulto.	Juegos de imitación recíproca. Rutinas con turnos imitativos. Modelado de acciones con objetos. Canciones con gestos.	Imitar al niño primero para establecer el turno. Cantar canciones con gestos. Juegos de manos y palmas.	Imita 3 gestos y 3 vocalizaciones en sesión observada	Observación de imitación	10 oportunidades por sesión	\N	\N	\N	\N	Imitar al niño antes de que él imite. Comenzar con imitaciones de objetos antes que gestos corporales.	\N	2026-03-13 19:42:44.4543	estimulación temprana	básico	activo	0	2	Atención conjunta (ET-001), juego funcional (ET-003), desarrollo motor	Atención conjunta básica (ET-001)	f	\N
383	LE-8-10-CF-B-01	Fonemas con gesto	Neurolengua	lectoescritura	Conciencia fonológica	8-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 22:00:31.517602	lectoescritura	básico	activo	8	10	\N	\N	t	2
3	CG-0-0-GEN-B-01	memoria de trabajo	Neurolengua	cognición	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 19:11:08.260829	cognición	básico	activo	\N	\N	\N	\N	f	\N
30	NL-008	Usar correctamente la concordancia de género y número	Neurolengua	Lenguaje Comprensivo-Expresivo	Morfología	6-8	El/la paciente producirá sintagmas nominales con concordancia correcta de género (el/la, un/una) y número (singular/plural) en al menos el 80% de sus producciones.	Corrección implícita de concordancias. Juegos de 'uno y muchos'. Descripciones de láminas corrigiendo errores. Completar oraciones con determinantes.	Señalar diferencias entre uno y varios objetos. Cantar canciones con plurales. Contar objetos enfatizando el plural.	80% de concordancias correctas en muestra de habla	Análisis morfológico de muestra	10 ítems por sesión	\N	\N	\N	\N	Usar recasts naturales; no corrección directa. Registrar en muestra de lenguaje espontáneo.	\N	2026-03-13 19:42:44.4543	lenguaje	intermedio	activo	6	8	Morfosintaxis, oraciones SVO (NL-002), memoria de trabajo	Combinaciones de dos palabras, vocabulario nominal básico	f	\N
98	NL-3-6-GEN-B-01	Objetivo de prueba E2E	Neurolengua	lenguaje	\N	3-5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-13 20:29:52.434705	lenguaje	básico	activo	3	5	\N	\N	f	\N
414	NL-9-12-MS-B-01	Organizar oraciones	Neurolengua	lenguaje	Morfosintaxis	9-12	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 22:32:31.598061	lenguaje	básico	activo	9	12	\N	\N	t	1
245	LN-6-8-COM-M-02	Comprender doble sentido y ambigüedad léxica en oraciones	Lenguaje	Lenguaje	Comprensión	6-8	El paciente explicará las dos interpretaciones posibles de palabras con doble sentido en contexto oracional con un 75 % de aciertos en 12 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
246	LN-6-8-COM-M-03	Comprender textos expositivos breves extrayendo idea principal	Lenguaje	Lenguaje	Comprensión	6-8	Tras leer un texto expositivo de 100-150 palabras, el paciente identificará la idea principal y dos ideas secundarias con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
420	SC-6-8-EMO-M-01	Reconocer emociones mixtas o ambivalentes en situaciones complejas	Comunicación Social	Comunicación Social	Reconocimiento emocional	6-8	El paciente identificará situaciones que generan emociones ambivalentes (emoción y miedo ante algo nuevo) y las describirá con vocabulario emocional preciso en el 70 % de los escenarios presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
421	SC-6-8-EMO-M-02	Mostrar empatía identificando y verbalizando la emoción del otro	Comunicación Social	Comunicación Social	Reconocimiento emocional	6-8	En situaciones de role-play, el paciente identificará la emoción del interlocutor y expresará verbalmente empatía (comprendo que te sientas así, debe ser difícil) en el 75 % de las situaciones emocionales presentadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
422	SC-6-8-EMO-A-01	Diferenciar entre lo que uno siente y lo que el otro siente (descentración emocional)	Comunicación Social	Comunicación Social	Reconocimiento emocional	6-8	El paciente distinguirá entre su propia emoción y la del interlocutor en situaciones de perspectiva emocional divergente, verbalizando ambas de forma correcta en el 75 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	6	8	\N	\N	f	\N
423	SC-8-10-EMO-A-01	Reconocer el impacto de las propias acciones en las emociones ajenas	Comunicación Social	Comunicación Social	Reconocimiento emocional	9-12	El paciente reflexionará sobre cómo sus palabras y acciones afectan las emociones de otros y ajustará su conducta en consecuencia, verbalizando al menos 2 conexiones causa-efecto por sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
28	NL-006	Comprender y producir lenguaje figurado (metáforas, refranes)	Neurolengua	Semántica	Semántica	9-12	El/la paciente identificará el significado no literal de expresiones idiomáticas, metáforas y refranes frecuentes del español, y podrá explicarlos con sus propias palabras.	Presentación de refranes con explicación contextual. Juegos de adivinanza con metáforas. Lectura de textos con lenguaje figurado. Creación propia de metáforas sencillas.	Comentar el significado de refranes cotidianos. Identificar metáforas en canciones o películas. Juego de 'adivina qué quiere decir'.	75% de comprensión en 10 expresiones presentadas	Comprensión y explicación verbal	5-6 por sesión	\N	\N	\N	\N	Comenzar con expresiones de alta frecuencia en el contexto cultural del paciente.	\N	2026-03-13 19:42:44.4543	lenguaje	avanzado	activo	9	12	Teoría de la mente, inferencias, conocimiento cultural	Comprensión literal robusta, vocabulario amplio	f	\N
142	HB-6-8-FLU-A-01	Generalizar técnicas de fluidez a situaciones comunicativas naturales	Habla	Habla	Fluidez generalizada	6-8	El paciente aplicará técnicas de fluidez (control de velocidad, inicio suave) en conversaciones con personas externas a la sesión, con un máximo de 5 % de disfluencias reportadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	avanzado	activo	6	8	\N	\N	f	\N
143	HB-6-8-DIS-M-01	Discriminar y producir fonemas de difícil adquisición en habla espontánea	Habla	Habla	Discriminación y producción	6-8	El paciente identificará y producirá correctamente los fonemas trabajados en el contexto de habla espontánea con autocorrección espontánea en el 70 % de los errores.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	intermedio	activo	6	8	\N	\N	f	\N
144	HB-6-8-ART-A-01	Generalizar la correcta articulación de fonemas trabajados al habla espontánea	Habla	Habla	Generalización articulatoria	6-8	El paciente producirá los fonemas trabajados correctamente en conversación espontánea en ambientes fuera de la sesión clínica, según reporte del familiar y observación directa.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	avanzado	activo	6	8	\N	\N	f	\N
145	HB-2-4-ART-B-02	Imitar secuencias de consonante-vocal en juegos de imitación	Habla	Habla	Imitación fonética	3-5	El paciente imitará secuencias CV presentadas por el terapeuta (ma, pa, ba, ta, da) con precisión articulatoria en el 80 % de los intentos en contexto lúdico.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	básico	activo	3	5	\N	\N	f	\N
146	HB-4-6-VEL-M-01	Regular la velocidad del habla en discurso oral espontáneo	Habla	Habla	Velocidad y ritmo	3-5	El paciente regulará su velocidad de habla a un ritmo moderado (entre 120-150 palabras por minuto) al narrar situaciones o describir imágenes en sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	intermedio	activo	3	5	\N	\N	f	\N
147	HB-4-6-DIS-M-01	Discriminar fonemas fricativos y oclusivos sordos y sonoros	Habla	Habla	Discriminación fonémica	3-5	El paciente discriminará auditivamente pares mínimos con contraste sordo/sonoro (/f/-/v/, /p/-/b/, /t/-/d/) con un 85 % de aciertos en 30 ítems presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	intermedio	activo	3	5	\N	\N	f	\N
148	HB-6-8-PRO-M-01	Usar variaciones prosódicas para transmitir estados emocionales	Habla	Habla	Prosodia expresiva	6-8	El paciente modulará el tono, intensidad y velocidad de su habla para expresar diferentes estados emocionales (alegría, sorpresa, tristeza) de forma reconocible en el 80 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	habla	intermedio	activo	6	8	\N	\N	f	\N
149	PR-2-4-AT-B-01	Establecer y mantener atención conjunta con el adulto	Pragmática	Pragmática	Atención conjunta	3-5	El paciente seguirá la mirada y el gesto de señalar del adulto para enfocar su atención en un objeto o evento, y lo mirará al adulto en el 75 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	básico	activo	3	5	\N	\N	f	\N
150	PR-2-4-FUN-B-01	Usar funciones comunicativas básicas: pedir, rechazar y saludar	Pragmática	Pragmática	Funciones comunicativas	3-5	El paciente usará medios verbales y/o gestuales intencionales para pedir objetos, rechazar actividades y saludar en al menos 3 contextos distintos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	básico	activo	3	5	\N	\N	f	\N
151	PR-2-4-PET-B-01	Realizar peticiones verbales espontáneas para obtener objetos o actividades	Pragmática	Pragmática	Petición	3-5	El paciente solicitará verbalmente objetos o actividades deseados (dame, quiero, más) de forma espontánea sin que el adulto los ofrezca previamente, en el 75 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	básico	activo	3	5	\N	\N	f	\N
152	PR-2-4-TUR-B-01	Respetar los turnos en interacciones de juego compartido	Pragmática	Pragmática	Turnos comunicativos	3-5	El paciente esperará su turno en juegos de intercambio de objetos y actividades de 2 participantes, respetándolo en al menos el 70 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	básico	activo	3	5	\N	\N	f	\N
153	PR-4-6-FUN-B-01	Usar formas de cortesía básica en intercambios comunicativos	Pragmática	Pragmática	Cortesía lingüística	3-5	El paciente utilizará formas de cortesía (por favor, gracias, perdón) de forma espontánea y apropiada al contexto en al menos el 75 % de las situaciones que lo requieren.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	básico	activo	3	5	\N	\N	f	\N
154	PR-4-6-TUR-M-01	Mantener un tema conversacional por al menos 4 turnos consecutivos	Pragmática	Pragmática	Mantenimiento del tópico	3-5	El paciente participará en conversaciones sobre un tema elegido por al menos 4 intercambios consecutivos sin desviarse del tópico, en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	3	5	\N	\N	f	\N
155	PR-4-6-FUN-M-01	Formular preguntas para obtener información en el contexto conversacional	Pragmática	Pragmática	Función interrogativa	3-5	El paciente formulará preguntas (qué, quién, dónde, cuándo) de forma espontánea para obtener información faltante en el 70 % de las situaciones de juego o conversación.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	3	5	\N	\N	f	\N
156	PR-4-6-CON-M-01	Iniciar una conversación con un par de forma apropiada	Pragmática	Pragmática	Habilidades conversacionales	3-5	El paciente iniciará una conversación con un par o adulto desconocido usando saludos y frases de apertura apropiadas al contexto, en el 70 % de las situaciones de juego grupal.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	3	5	\N	\N	f	\N
157	PR-4-6-NAR-M-01	Narrar un evento social o escolar de forma coherente a un oyente	Pragmática	Pragmática	Narrativa social	3-5	El paciente relatará un evento ocurrido en el colegio o en casa con al menos 3 elementos (quién, qué hizo, qué pasó), con información suficiente para que el oyente comprenda.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	3	5	\N	\N	f	\N
158	PR-4-6-ADP-M-01	Adaptar el tono y el vocabulario según el interlocutor (niño vs adulto)	Pragmática	Pragmática	Adaptación comunicativa	3-5	El paciente modificará su forma de hablar (vocabulario, tono, longitud de oración) al dirigirse a un niño pequeño vs un adulto, observable en situaciones de juego de roles.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	3	5	\N	\N	f	\N
159	PR-6-8-CON-M-01	Reparar rupturas comunicativas de forma activa	Pragmática	Pragmática	Reparación conversacional	6-8	Cuando el oyente no comprenda, el paciente usará estrategias de reparación (repetir, reformular, agregar información) en el 80 % de las señales de incomprensión del oyente.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	6	8	\N	\N	f	\N
160	PR-6-8-CON-M-02	Mantener y cambiar tópicos conversacionales de forma apropiada	Pragmática	Pragmática	Gestión del tópico	6-8	El paciente mantendrá un tema conversacional por al menos 6 turnos y realizará cambios de tema de forma fluida usando marcadores (a propósito, hablando de eso) en el 70 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.597921	pragmática	intermedio	activo	6	8	\N	\N	f	\N
161	PR-6-8-ADP-M-01	Adaptar el discurso según el contexto formal o informal	Pragmática	Pragmática	Registro lingüístico	6-8	El paciente modificará su registro lingüístico (vocabulario, construcciones, tono) al pasar de un contexto informal (juego) a uno formal (presentación en clase) de forma observable.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	intermedio	activo	6	8	\N	\N	f	\N
162	PR-6-8-NAR-A-01	Narrar historias personales reconociendo las necesidades informativas del oyente	Pragmática	Pragmática	Perspectiva del oyente	6-8	El paciente proveerá suficiente información de fondo al narrar una experiencia a alguien que no estuvo presente, ajustando la cantidad de detalle según lo que el oyente ya sabe.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	avanzado	activo	6	8	\N	\N	f	\N
163	PR-6-8-LNL-A-01	Comprender y usar el sarcasmo y la ironía en contextos apropiados	Pragmática	Pragmática	Lenguaje no literal	6-8	El paciente identificará la intención irónica o sarcástica de enunciados presentados en viñetas, explicando qué significa realmente el hablante, con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	avanzado	activo	6	8	\N	\N	f	\N
164	PR-6-8-FUN-A-01	Usar peticiones indirectas apropiadas al contexto social	Pragmática	Pragmática	Actos de habla indirectos	6-8	El paciente formulará solicitudes de forma indirecta (¿podrías bajar el volumen?) en lugar de imperativos directos, de forma apropiada al contexto social en el 75 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	avanzado	activo	6	8	\N	\N	f	\N
165	PR-4-6-PET-B-01	Pedir objetos y acciones usando frases completas	Pragmática	Pragmática	Petición	3-5	El paciente formulará peticiones usando frases completas (quiero el juego rojo, por favor dame el lápiz) de forma espontánea en el contexto de la sesión en el 80 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	básico	activo	3	5	\N	\N	f	\N
166	PR-2-4-FUN-B-02	Usar el gesto de señalar con función declarativa e imperativa	Pragmática	Pragmática	Comunicación gestual	3-5	El paciente señalará objetos distantes para mostrarlos o pedirlos al adulto de forma intencional y consistente, diferenciando entre señalar para compartir (mira) y para pedir (dame).	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	básico	activo	3	5	\N	\N	f	\N
167	PR-6-8-CON-A-01	Participar activamente en una discusión grupal aportando ideas propias	Pragmática	Pragmática	Discusión grupal	6-8	El paciente participará en una discusión grupal de 3-4 personas aportando al menos 3 contribuciones relevantes, sin interrumpir y respondiendo a las ideas de otros.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	avanzado	activo	6	8	\N	\N	f	\N
168	PR-4-6-CON-M-02	Reconocer y reparar malentendidos durante la conversación	Pragmática	Pragmática	Reparación conversacional	3-5	Cuando el oyente muestre señales de no entender (cara de confusión, pregunta), el paciente reformulará su enunciado usando estrategias de clarificación en el 70 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	pragmática	intermedio	activo	3	5	\N	\N	f	\N
169	MO-2-4-TON-B-01	Mejorar el tono labial mediante ejercicios activos con resistencia	Motricidad Orofacial	Motricidad Orofacial	Tono muscular labial	3-5	El paciente mantendrá el cierre labial durante al menos 10 segundos mientras el terapeuta aplica resistencia suave en los labios, logrando la meta en 3 de 5 intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
170	MO-2-4-PRX-B-01	Imitar movimientos labiales básicos (beso, sonrisa, morritos) ante el espejo	Motricidad Orofacial	Motricidad Orofacial	Praxis labiales	3-5	El paciente imitará 5 movimientos labiales distintos (beso, sonrisa, vibración, protrusión, retracción) ante el espejo con el 80 % de precisión en 3 sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
108	NL-4-6-COM-B-01	Seguir instrucciones de dos pasos sin apoyo gestual	Lenguaje	Lenguaje	Comprensión	3-5	El paciente seguirá instrucciones verbales de dos pasos (agarra el lápiz y ponlo en la caja) sin apoyo gestual con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
109	NL-4-6-MOR-B-01	Producir oraciones con sujeto, verbo y complemento	Lenguaje	Lenguaje	Morfosintaxis	3-5	El paciente producirá oraciones de al menos 3 elementos (S+V+O) de forma espontánea al describir escenas de imágenes, en el 75 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
110	NL-4-6-SEM-B-01	Relacionar palabras por asociación funcional (cuchara-plato)	Lenguaje	Lenguaje	Semántica relacional	3-5	El paciente emparejará al menos 10 pares de palabras relacionadas funcionalmente (cepillo-peine, zapato-calcetín) con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
111	NL-4-6-LEX-M-01	Usar vocabulario descriptivo (color, tamaño, forma)	Lenguaje	Lenguaje	Léxico descriptivo	3-5	El paciente describirá objetos usando al menos 3 atributos (color, tamaño, forma) de forma espontánea al describir imágenes o juguetes, con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
112	NL-4-6-MOR-M-01	Usar correctamente artículos definidos e indefinidos y preposiciones básicas	Lenguaje	Lenguaje	Morfología gramatical	3-5	El paciente usará artículos (el, la, un, una) y preposiciones (en, sobre, debajo) correctamente en oraciones espontáneas con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
113	NL-4-6-COM-M-01	Comprender absurdos verbales simples	Lenguaje	Lenguaje	Comprensión inferencial	3-5	El paciente identificará y explicará qué es incorrecto en oraciones absurdas simples (El pescado sube a los árboles) en el 80 % de los ítems presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
114	NL-4-6-NAR-M-01	Narrar un cuento corto con inicio, desarrollo y final	Lenguaje	Lenguaje	Narrativo	3-5	El paciente narrará un cuento de 3 imágenes secuenciadas incluyendo personaje, acción y resolución, usando conectores temporales básicos (primero, después, al final).	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
115	NL-4-6-INF-M-01	Anticipar finales de cuentos usando claves del contexto	Lenguaje	Lenguaje	Inferencias	3-5	El paciente anticipará el desenlace de un cuento antes de escuchar el final, usando información contextual, con justificación coherente en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
116	NL-6-8-LEX-M-01	Comprender y usar antónimos y sinónimos en contexto	Lenguaje	Lenguaje	Relaciones léxicas	6-8	El paciente identificará y producirá sinónimos y antónimos de palabras frecuentes de uso escolar con un 80 % de aciertos en actividades estructuradas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
117	NL-6-8-MOR-M-01	Usar formas verbales en pasado y futuro correctamente	Lenguaje	Lenguaje	Morfología verbal	6-8	El paciente producirá verbos regulares e irregulares frecuentes en tiempo pasado y futuro con concordancia de persona y número, con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
118	NL-6-8-COM-M-01	Realizar inferencias causales en textos escuchados	Lenguaje	Lenguaje	Comprensión inferencial	6-8	Tras escuchar un texto breve, el paciente responderá preguntas de causa-efecto (¿por qué ocurrió esto?) con respuestas ajustadas al texto en el 80 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
119	NL-6-8-NAR-M-01	Narrar experiencias personales con secuencia lógica	Lenguaje	Lenguaje	Narrativo personal	6-8	El paciente narrará un evento personal con mínimo 5 oraciones, incluyendo contexto, acciones y desenlace, usando marcadores temporales con coherencia.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
120	NL-6-8-DIS-M-01	Usar conectores temporales y causales en el discurso oral	Lenguaje	Lenguaje	Discurso oral	6-8	El paciente usará conectores (porque, entonces, después, sin embargo) de forma apropiada al narrar o explicar situaciones, con un mínimo de 4 conectores distintos por muestra de habla.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
121	NL-6-8-LEX-A-01	Comprender y usar vocabulario académico en contexto escolar	Lenguaje	Lenguaje	Léxico académico	6-8	El paciente comprenderá y usará vocabulario de dominio escolar (clasificar, comparar, describir, explicar) en tareas académicas con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
122	NL-6-8-MOR-A-01	Producir oraciones subordinadas con concordancia correcta	Lenguaje	Lenguaje	Sintaxis compleja	6-8	El paciente producirá oraciones con cláusulas subordinadas causales, temporales o relativas con concordancia correcta en el 80 % de las producciones espontáneas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
123	NL-6-8-NAR-A-01	Producir narraciones con perspectiva de múltiples personajes	Lenguaje	Lenguaje	Narrativo avanzado	6-8	El paciente narará historias incluyendo el punto de vista de al menos 2 personajes distintos, con atribución de estados mentales y emociones diferenciados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
124	NL-6-8-SEM-A-01	Comprender lenguaje figurado: metáforas y analogías	Lenguaje	Lenguaje	Semántica avanzada	6-8	El paciente explicará el significado de expresiones figuradas (tiene manos de seda, es rápido como un rayo) con paráfrasis ajustada en el 80 % de los ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
125	NL-6-8-INF-A-01	Realizar inferencias pragmáticas en situaciones cotidianas	Lenguaje	Lenguaje	Inferencias pragmáticas	6-8	El paciente inferirá la intención del hablante en situaciones no literales (ironía, indirectas) y explicará correctamente el significado implícito en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
126	NL-6-8-DIS-A-01	Producir discurso expositivo estructurado con argumentos	Lenguaje	Lenguaje	Discurso expositivo	6-8	El paciente expondrá un tema de su interés durante 2 minutos con introducción, al menos 2 argumentos y cierre, usando vocabulario preciso y conectores lógicos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
127	NL-4-6-REL-M-01	Identificar relaciones parte-todo en objetos y seres vivos	Lenguaje	Lenguaje	Relaciones semánticas	3-5	El paciente identificará la parte de un todo al escuchar el nombre del todo (rueda → auto) y viceversa, con un 80 % de aciertos en 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
128	NL-4-6-EXP-B-01	Expresar preferencias y rechazos usando oraciones simples	Lenguaje	Lenguaje	Expresión oral	3-5	El paciente expresará sus preferencias y rechazos con oraciones de al menos dos elementos (quiero jugar, no me gusta eso) de forma espontánea en el contexto de la sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	lenguaje	básico	activo	3	5	\N	\N	f	\N
129	HB-2-4-ART-B-01	Producir vocales y consonantes bilabiales en posición inicial	Habla	Habla	Articulación	3-5	El paciente producirá las vocales y las consonantes /p/, /b/, /m/ en posición inicial de sílaba al imitar al terapeuta con un 80 % de precisión articulatoria.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
24	NL-002	Producir oraciones simples de estructura sujeto-verbo-objeto	Neurolengua	Lenguaje Expresivo	Morfosintaxis	3-5	El/la paciente producirá oraciones simples de 3 o más palabras con estructura SVO en respuesta a preguntas y en situaciones de narración espontánea.	Modelado de oraciones durante el juego. Expansiones lingüísticas. Narración de láminas de acción. Completar frases con apoyo visual.	Preguntar '¿qué está haciendo?' al mirar cuentos. Expandir las frases del niño añadiendo sujeto o complemento. Describir lo que hacen juntos durante actividades diarias.	75% de oportunidades en 3 sesiones consecutivas	Muestra de lenguaje espontáneo	8 por sesión	\N	\N	\N	\N	Usar expansiones y recasts. No exigir repetición; modelar de forma natural en el juego.	\N	2026-03-13 19:42:44.4543	lenguaje	básico	activo	3	5	Vocabulario expresivo básico (NL-001), comprensión de acciones	Léxico de al menos 50 palabras, algunas combinaciones de dos palabras espontáneas	f	\N
25	NL-003	Comprender y ejecutar instrucciones de dos o más pasos	Neurolengua	Lenguaje Comprensivo-Expresivo	Comprensión	6-8	El/la paciente comprenderá instrucciones verbales que incluyan 2 o más acciones secuenciadas, sin apoyo gestual del examinador.	Instrucciones durante actividades de juego. Seguimiento de consignas en tareas de papel. Juegos de roles con instrucciones encadenadas. Actividades de cocina o construcción.	Dar instrucciones cotidianas en dos pasos ('agarra tu mochila y ponla en la silla'). Juego de 'Simón dice' con dos acciones. Rutinas con pasos explícitos.	80% en 4 de 5 oportunidades	Ejecución conductual	6 por sesión	\N	\N	\N	\N	Verificar que no haya dificultades auditivas. Comenzar con instrucciones de contenido familiar.	\N	2026-03-13 19:42:44.4543	lenguaje	intermedio	activo	6	8	Memoria de trabajo, atención auditiva, comprensión de vocabulario	Comprensión de instrucciones de un paso con 90% de éxito	f	\N
26	NL-004	Narrar eventos con estructura temporal coherente	Neurolengua	Lenguaje Narrativo	Narrativo	6-8	El/la paciente narrará eventos pasados o cuentos con al menos 5 proposiciones ordenadas temporalmente, incluyendo inicio, desarrollo y cierre.	Renarración de cuentos con apoyo de secuencias de imágenes. Narración de eventos propios. Uso de organizadores visuales de historia. Grabación y escucha de sus narraciones.	Pedir al niño que cuente cómo fue su día escolar. Leer y luego preguntar '¿qué pasó primero, después y al final?'. Armar álbumes de fotos narrando lo ocurrido.	Narración con 5+ proposiciones coherentes en 3 de 4 muestras	Análisis narrativo	2-3 narrativas por sesión	\N	\N	\N	\N	Usar preguntas facilitadoras, no interrumpir. Registrar longitud y coherencia del relato.	\N	2026-03-13 19:42:44.4543	lenguaje	intermedio	activo	6	8	Memoria episódica, conectores temporales, vocabulario de tiempo	Oraciones de 3+ palabras (NL-002), secuencias de 3 elementos	f	\N
27	NL-005	Usar conectores causales y temporales en discurso oral	Neurolengua	Lenguaje Expresivo	Conectores	6-8	El/la paciente usará de forma apropiada conectores causales (porque, ya que, por eso) y temporales (primero, después, finalmente) en su producción oral espontánea y estructurada.	Completar oraciones con conectores. Explicar causas de eventos. Narrar con apoyo de conectores escritos en tarjetas. Análisis de cuentos señalando conectores.	Preguntar '¿por qué crees que pasó eso?' al leer cuentos. Armar secuencias de acciones con palabras de orden (primero, luego, por último).	80% de uso correcto en muestra de discurso	Análisis de discurso	5 por sesión	\N	\N	\N	\N	Trabajar primero temporales, luego causales. Usar actividades de causalidad física antes de social.	\N	2026-03-13 19:42:44.4543	lenguaje	avanzado	activo	6	8	Narrativo (NL-004), razonamiento causal, planificación del discurso	Narración básica (NL-004), comprensión de causa-efecto	f	\N
33	HA-003	Mejorar la inteligibilidad del habla espontánea	Neurolengua	Habla	Inteligibilidad	6-8	El/la paciente aumentará su porcentaje de inteligibilidad en habla espontánea con interlocutores no familiares del 50% al 80% o más.	Juegos de descripción sin apoyo visual para el interlocutor. Grabaciones y análisis de inteligibilidad. Práctica en situaciones comunicativas reales. Técnicas de desaceleración del habla.	No anticipar lo que el niño quiere decir; esperar que se exprese. Pedir aclaraciones de forma natural. Pedir que repita usando estrategias aprendidas.	80% de inteligibilidad con interlocutor no familiar	Ratio de inteligibilidad	Muestra de 50 palabras por sesión	\N	\N	\N	\N	Calcular % de inteligibilidad con interlocutor ciego. Considerar examen auditivo periódico.	\N	2026-03-13 19:42:44.4543	habla	intermedio	activo	6	8	Articulación (HA-001), procesos fonológicos (HA-002), velocidad del habla	Articulación de fonemas objetivo en palabras aisladas	f	\N
35	HA-005	Discriminar auditivamente pares mínimos de fonemas	Neurolengua	Habla	Discriminación auditiva	3-5	El/la paciente discriminará de forma auditiva pares mínimos que difieran en un único rasgo fonológico (ej. /p/-/b/, /t/-/d/, /s/-/z/) con un 80% de acierto.	Juegos de 'señala cuál escuchas'. Pares mínimos con imágenes. Bombardeo auditivo. Clasificación de palabras por sonido inicial.	Juego de 'adivina qué palabra dije'. Canciones con pares de palabras similares. Leer rimas y señalar palabras que suenan parecido.	80% de discriminaciones correctas	Discriminación auditiva con imagen	20 pares por sesión	\N	\N	\N	\N	Descartar hipoacusia antes de iniciar. Comenzar con pares de alta frecuencia.	\N	2026-03-13 19:42:44.4543	habla	básico	activo	3	5	Memoria auditiva, atención sostenida, procesamiento fonológico	Audición dentro de parámetros normales (descartar hipoacusia)	f	\N
36	PR-001	Mantener contacto visual durante el intercambio comunicativo	Neurolengua	Pragmática	Comunicación no verbal	3-5	El/la paciente mantendrá contacto visual con su interlocutor durante al menos el 50% del tiempo de conversación o juego compartido.	Juegos cara a cara con objeto de interés. Rutinas con atención conjunta. Juego del espejo. Actividades interactivas que requieran mirar al otro.	Ponerse a la altura del niño al hablarle. Usar juegos de 'míranos'. Esperar el contacto visual antes de dar lo que pide.	50% del tiempo de interacción con mirada social	Observación en juego	Observar en 10 minutos de juego libre	\N	\N	\N	\N	No forzar el contacto visual directo; propiciar situaciones naturales. Considerar perfil sensorial.	\N	2026-03-13 19:42:44.4543	pragmática	básico	activo	3	5	Atención conjunta, gestos comunicativos (PR-004), regulación sensorial	Ninguno obligatorio; adaptar a perfil sensorial	f	\N
182	MO-6-8-DEG-A-01	Corregir postura corporal y posición de cabeza durante la deglución	Motricidad Orofacial	Motricidad Orofacial	Postura deglutoria	6-8	El paciente adoptará postura erguida con la cabeza en posición neutra durante la deglución, sin extensión cervical compensatoria, en el 80 % de las ingestas observadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	motricidad orofacial	avanzado	activo	6	8	\N	\N	f	\N
183	MO-6-8-TON-A-01	Fortalecer musculatura velar para mejorar el cierre velofaríngeo	Motricidad Orofacial	Motricidad Orofacial	Musculatura velar	6-8	El paciente producirá consonantes orales (/p/, /t/, /k/) con adecuado cierre velofaríngeo (sin hipernasalidad audible) en el 80 % de las palabras en habla continua.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	motricidad orofacial	avanzado	activo	6	8	\N	\N	f	\N
38	PR-003	Iniciar y mantener tópicos de conversación de forma apropiada	Neurolengua	Pragmática	Habilidades conversacionales	6-8	El/la paciente iniciará temas de conversación relevantes y los mantendrá por al menos 4 intercambios, realizando preguntas y comentarios apropiados al contexto.	Scripts conversacionales con temas de interés. Role-play de situaciones sociales. Análisis de conversaciones grabadas. Juego de 'seguir el tema'.	Conversar en familia sobre temas del interés del niño. Modelar cómo añadir información a un tema. Evitar respuestas monosilábicas.	Mantiene tópico 4+ intercambios en el 75% de las situaciones	Análisis de conversación	3 situaciones conversacionales por sesión	\N	\N	\N	\N	Usar temas de alta motivación para el paciente. Trabajar en grupo pequeño cuando sea posible.	\N	2026-03-13 19:42:44.4543	pragmática	avanzado	activo	6	8	Turnos (PR-002), conocimiento del mundo, memoria de trabajo	Respeto de turnos (PR-002), repertorio léxico funcional	f	\N
130	HB-2-4-FON-B-01	Reducir el proceso fonológico de omisión de consonante final	Habla	Habla	Procesos fonológicos	3-5	El paciente producirá palabras CV+C (pan, sol, mar) conservando la consonante final en el 80 % de los intentos en actividades dirigidas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
131	HB-2-4-DIS-B-01	Discriminar auditivamente palabras monosílabas de dos sílabas	Habla	Habla	Discriminación auditiva	3-5	El paciente señalará la imagen correcta entre dos alternativas (palabras que difieren en longitud silábica) al escuchar la palabra, con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
132	HB-4-6-ART-B-01	Producir fonemas fricativos /f/ y /s/ en posición inicial y media	Habla	Habla	Articulación	3-5	El paciente producirá /f/ y /s/ en palabras y frases cortas en posición inicial y media con un 80 % de corrección articulatoria en sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
133	HB-4-6-FON-B-01	Reducir el proceso de sustitución de fonemas velares por alveolares	Habla	Habla	Procesos fonológicos	3-5	El paciente producirá palabras con /k/ y /g/ sin sustituirlas por /t/ y /d/ en el 80 % de los intentos en actividades estructuradas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
134	HB-4-6-DIS-B-01	Discriminar pares mínimos que difieren en un único fonema	Habla	Habla	Discriminación auditiva	3-5	El paciente señalará correctamente la imagen correspondiente al par mínimo escuchado (pala/bala, cama/gama) con un 85 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
135	HB-4-6-ART-M-01	Producir el fonema /r/ simple en posición intervocálica	Habla	Habla	Articulación	3-5	El paciente producirá el fonema /r/ simple (cara, puro, torero) en palabras y frases con un 80 % de precisión tras práctica en nivel de sílaba y palabra.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	intermedio	activo	3	5	\N	\N	f	\N
44	MO-004	Corregir el patrón de deglución atípica	Neurolengua	Motricidad Orofacial	Deglución	3-5	El/la paciente adoptará un patrón de deglución con lengua en posición correcta (contra el paladar duro anterior) sin interposición lingual, con labios sellados.	Ejercicios de elevación lingual. Técnica de deglución con posicionamiento correcto. Trabajo con diferentes consistencias. Biofeedback visual con espejo.	Recordar postura correcta al comer. Ofrecer alimentos que estimulen la deglución correcta. Seguimiento del programa de ejercicios indicado.	Patrón correcto en el 80% de degluciones observadas	Evaluación de deglución observada	20 degluciones por sesión	\N	\N	\N	\N	Coordinar con odontología y ortodoncia si hay maloclusión asociada. Trabajar en contexto de alimentación real.	\N	2026-03-13 19:42:44.4543	motricidad orofacial	avanzado	activo	3	5	Tono muscular (MO-001), praxis (MO-002), musculatura perioral	Evaluación de deglución completada, descarte de problemas estructurales	f	\N
45	LE-001	Desarrollar conciencia fonológica: silábica y fonémica	Neurolengua	Lectoescritura	Conciencia fonológica	6-8	El/la paciente segmentará palabras en sílabas, identificará rimas, reconocerá el fonema inicial y final de palabras, y realizará síntesis silábica con un 80% de acierto.	Juegos de rimas y adivinanzas. Palmadas para contar sílabas. Ordenar palabras por sonido inicial. Juegos de 'empieza con...'.	Cantar canciones con rimas. Contar sílabas dando palmadas al caminar. Buscar palabras que empiecen con el mismo sonido.	80% de éxito en 4 tareas fonológicas básicas	Prueba de conciencia fonológica	10 ítems por tarea y sesión	\N	\N	\N	\N	Trabajar conciencia silábica antes que fonémica. Usar materiales visuales de apoyo.	\N	2026-03-13 19:42:44.4543	lectoescritura	básico	activo	6	8	Discriminación auditiva (HA-005), memoria fonológica, vocabulario	Discriminación de pares mínimos (HA-005), vocabulario receptivo de 100+ palabras	f	\N
46	LE-002	Reconocer y leer palabras monosílabas y bisílabas	Neurolengua	Lectoescritura	Lectura	6-8	El/la paciente leerá palabras monosílabas y bisílabas de vocabulario frecuente con decodificación fonológica correcta en al menos el 80% de los intentos.	Lectura de listas de palabras regulares. Tarjetas de sílabas directas. Juego de dominó de sílabas. Lectura con seguimiento digital.	Leer cuentos simples juntos. Practicar con tarjetas de palabras. Señalar palabras conocidas en el entorno.	80% de palabras leídas correctamente en listado de 20	Listado de palabras	20 palabras por sesión	\N	\N	\N	\N	Comenzar con palabras CVC y CVCV regulares. Evitar palabras con grupos consonánticos hasta lograr dominio básico.	\N	2026-03-13 19:42:44.4543	lectoescritura	básico	activo	6	8	Conciencia fonológica (LE-001), correspondencia grafema-fonema, memoria visual	Conciencia fonológica básica (LE-001), reconocimiento de letras del alfabeto	f	\N
47	LE-003	Comprender textos breves respondiendo preguntas literales e inferenciales	Neurolengua	Lectoescritura	Comprensión lectora	6-8	El/la paciente leerá textos de 3-5 oraciones y responderá correctamente al menos el 80% de preguntas literales e inferenciales simples sobre lo leído.	Lectura de cuentos breves con preguntas guiadas. Actividades de predicción e inferencia. Mapas de historia (personaje, problema, solución). Relectura con foco en detalles.	Leer juntos y hacer preguntas sobre lo leído. Predecir finales de cuentos. Comentar el mensaje del texto.	80% de respuestas correctas a preguntas del texto	Cuestionario de comprensión	1-2 textos por sesión	\N	\N	\N	\N	Adaptar el nivel de texto al rendimiento lector del paciente. Trabajar vocabulario desconocido antes de la lectura.	\N	2026-03-13 19:42:44.4543	lectoescritura	intermedio	activo	6	8	Decodificación (LE-002), narración (NL-004), inferencia	Decodificación fluida (LE-002), comprensión oral de textos simples	f	\N
49	CO-001	Mantener la atención sostenida en tarea estructurada por 10 minutos	Neurolengua	Cognición	Atención	6-8	El/la paciente permanecerá en tarea durante al menos 10 minutos continuos en actividades estructuradas (puzzle, láminas, tareas de papel), con mínimas redirecciones.	Técnicas de regulación atencional. Actividades con incremento gradual de tiempo. Uso de temporizadores visuales. Juegos de concentración y memoria.	Establecer rutinas de estudio con tiempos cortos y descansos. Usar reloj visual. Eliminar distractores durante tareas.	10 minutos continuos en tarea en 4 de 5 sesiones	Tiempo en tarea	2-3 tareas por sesión	\N	\N	\N	\N	Comenzar con tareas de alta motivación. Usar refuerzo diferencial de atención. Coordinar con equipo escolar si es pertinente.	\N	2026-03-13 19:42:44.4543	cognición	básico	activo	6	8	Memoria de trabajo, inhibición de respuesta, regulación emocional	Atención mínima de 3-5 minutos en tarea de interés	f	\N
51	CO-003	Mejorar la planificación y organización en tareas cotidianas	Neurolengua	Cognición	Funciones ejecutivas	9-12	El/la paciente secuenciará pasos para completar una tarea de múltiples etapas, anticipará materiales necesarios y seguirá el plan con supervisión mínima.	Planificación de actividades con tarjetas de pasos. Actividades de resolución de problemas en etapas. Role-play de planificación de eventos. Uso de listas de verificación.	Involucrar al niño en planear actividades del hogar. Usar listas de pasos para las rutinas. Revisar juntos el plan antes de ejecutar.	Completa tarea de 5 pasos con 1 o menos redirecciones en 3 sesiones	Observación de planificación	2 tareas de planificación por sesión	\N	\N	\N	\N	Comenzar con tareas familiares y de interés del paciente. Usar apoyos visuales en etapas iniciales.	\N	2026-03-13 19:42:44.4543	cognición	intermedio	activo	9	12	Narrativo (NL-004), atención (CO-001), memoria de trabajo (CO-002), razonamiento	Secuencias temporales de 3 pasos, atención sostenida básica	f	\N
52	CO-004	Desarrollar control inhibitorio ante respuestas impulsivas	Neurolengua	Cognición	Razonamiento	6-8	El/la paciente aplicará estrategias de pausa-reflexión (stop-think-act) antes de responder en situaciones de alta demanda cognitiva y social, reduciendo respuestas impulsivas.	Secuencias de causa-efecto con imágenes. Experimentos simples con explicación causal. Role-play de situaciones cotidianas. Preguntas de 'qué pasó porque...'.	Preguntar '¿por qué crees que pasó eso?' en situaciones diarias. Comentar causas de eventos del cuento al leer. Experimentos caseros simples.	70% de respuestas reflexivas en situaciones identificadas	Tasa de respuestas impulsivas/reflexivas	5 situaciones de práctica por sesión	\N	\N	\N	\N	Comenzar con relaciones causales físicas antes de sociales o emocionales.	\N	2026-03-13 19:42:44.4543	cognición	avanzado	activo	6	8	Razonamiento inductivo, vocabulario causal (NL-005), comprensión (NL-003)	Comprensión de 2+ pasos (NL-003), vocabulario básico de acciones	f	\N
53	CO-005	Mejorar la flexibilidad cognitiva ante cambios de tarea y reglas	Neurolengua	Cognición	Flexibilidad cognitiva	9-12	El/la paciente realizará transiciones entre tareas o cambios de regla sin resistencia excesiva, ajustando su conducta en menos de 2 minutos en el 75% de las situaciones.	Técnicas de 'para y piensa'. Juegos de inhibición (Stop!). Estrategias de revisión de la propia respuesta. Retroalimentación diferida.	Enseñar la 'tortuga' (parar y pensar). Establecer señales visuales o gestuales para recordar pausar. Reforzar en casa la reflexión antes de actuar.	75% de transiciones sin resistencia en 2 minutos	Tiempo y calidad de transición	3-4 situaciones de cambio por sesión	\N	\N	\N	\N	Usar refuerzo positivo diferido. Coordinar con equipo escolar para generalización.	\N	2026-03-13 19:42:44.4543	cognición	avanzado	activo	9	12	Atención (CO-001), planificación (CO-003), regulación emocional	Atención sostenida de 5+ minutos (CO-001), comprensión de normas simples	f	\N
54	ET-001	Seguimiento visual de objetos en movimiento	Neurolengua	Estimulación Temprana	Atención conjunta	0-2	El/la bebé rastreará visualmente un objeto en movimiento en planos horizontal, vertical y circular, manteniendo la mirada por al menos 3 segundos.	Seguimiento de mirada del clínico hacia juguetes. Actividades de interacción cara a cara. Juegos de atención al objeto de interés. Actividades de señalización.	Hablar con el bebé siguiendo su mirada. Señalar objetos juntos. Leer libros de imágenes señalando y nombrando. Juegos de cara a cara.	Seguimiento en 3 planos por 3+ segundos en 3 sesiones	Observación de seguimiento	5 ensayos por plano	\N	\N	\N	\N	Guiar a los padres para seguir los intereses del niño en lugar de redirigir. Evaluar audición y visión si no hay respuesta.	\N	2026-03-13 19:42:44.4543	estimulación temprana	básico	activo	0	2	Contacto visual (PR-001), gestos comunicativos (PR-004), imitación social	Ninguno — es el primer hito del desarrollo comunicativo	f	\N
56	ET-003	Comprender palabras funcionales del entorno familiar	Neurolengua	Estimulación Temprana	Juego	0-2	El/la niño/a comprenderá al menos 20 palabras de su entorno cotidiano (nombres de personas, objetos del hogar, acciones básicas) respondiendo con acción, señal o mirada.	Modelado de uso funcional de objetos. Juego simbólico con roles simples. Uso de miniaturas temáticas. Rutinas de juego con muñecos.	Jugar con el niño usando objetos cotidianos de forma funcional. Modelar juego de 'hacer como si...'. Proporcionar juguetes que inviten al juego simbólico.	Comprensión de 20+ palabras registradas en inventario	Inventario de vocabulario comprensivo	Registro de inventario MacArthur mensual	\N	\N	\N	\N	Seguir el liderazgo del niño en el juego. No estructurar demasiado; permitir la espontaneidad.	\N	2026-03-13 19:42:44.4543	estimulación temprana	básico	activo	0	2	Imitación (ET-002), vocabulario (NL-001), atención conjunta (ET-001)	Imitación de acciones con objetos (ET-002)	f	\N
32	HA-002	Reducir procesos de simplificación fonológica (sustitución y omisión)	Neurolengua	Habla	Procesos fonológicos	3-5	El/la paciente reducirá los procesos de sustitución y omisión de fonemas en posiciones media y final de palabra, mejorando la estructura silábica CVC y CCVC.	Análisis de errores fonológicos con retroalimentación visual. Mínimos pares con significado. Ejercicios de segmentación silábica. Bombardeo auditivo.	Leer en voz alta lentamente, modelando la palabra correcta. Juego de 'repite cómo yo lo digo'. Escuchar audios de palabras objetivo.	Reducción del 50% en errores respecto al baseline en 8 semanas	Análisis de errores fonológicos	15 palabras objetivo por sesión	\N	\N	\N	\N	Priorizar fonemas de adquisición temprana. Usar feedback visual (espejo, app de feedback).	\N	2026-03-13 19:42:44.4543	habla	intermedio	activo	3	5	Discriminación auditiva (HA-005), articulación básica (HA-001), conciencia fonológica	Discriminación auditiva de pares mínimos, articulación de fonemas en posición inicial	f	\N
34	HA-004	Reducir disfluencias e implementar técnicas de fluidez	Neurolengua	Habla	Fluidez	9-12	El/la paciente aplicará técnicas de control de fluidez (arranque suave, habla fluida, control de velocidad) reduciendo el porcentaje de sílabas disfluentes por debajo del 3% en conversación.	Entrenamiento en respiración abdominal. Técnica de habla fluida y arranque suave. Práctica de habla en diferentes contextos. Desensibilización a disfluencias.	Mantener contacto visual y escuchar sin interrumpir. No terminar las frases del niño. Hablar con ritmo pausado. Reducir preguntas directas en situaciones de alta demanda.	< 3% de sílabas disfluentes en conversación espontánea	Porcentaje de sílabas disfluentes	Muestras de 300 sílabas por sesión	\N	\N	\N	\N	Involucrar a la familia en el tratamiento. Coordinar con la escuela. Trabajar la actitud hacia la tartamudez.	\N	2026-03-13 19:42:44.4543	habla	avanzado	activo	9	12	Coordinación fonorrespiratoria (MO-003), control atencional, manejo de ansiedad	Motivación para el tratamiento, diagnóstico de tartamudez confirmado	f	\N
184	MO-2-4-PRX-B-02	Realizar movimientos linguales de lateralización y elevación	Motricidad Orofacial	Motricidad Orofacial	Praxis linguales	3-5	El paciente realizará movimientos de lateralización y elevación lingual siguiendo el modelo del terapeuta en el espejo, con precisión en 4 de 6 movimientos diferentes.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
37	PR-002	Respetar los turnos conversacionales	Neurolengua	Pragmática	Conversación	3-5	El/la paciente respetará los turnos en intercambios conversacionales con el/la profesional y con pares, esperando su turno para hablar en al menos el 80% de las oportunidades.	Juegos de turnos con objeto símbolo. Conversaciones estructuradas con señal visual de turno. Role-play de situaciones cotidianas. Juegos de mesa con turno explícito.	Hablar en familia respetando el turno de cada uno. Usar una 'pelota de hablar'. Juegos de mesa que requieran respetar turnos.	80% de turnos respetados en intercambio de 10 minutos	Observación en interacción	Observar en conversación libre	\N	\N	\N	\N	Usar señales visuales (luz, tarjeta) al inicio del tratamiento. Reducir apoyos gradualmente.	\N	2026-03-13 19:42:44.4543	pragmática	intermedio	activo	3	5	Contacto visual (PR-001), inhibición de respuesta, escucha activa	Intención comunicativa presente, comprensión de reglas simples	f	\N
39	PR-004	Usar gestos comunicativos intencionales (señalar, mostrar, dar)	Neurolengua	Pragmática	Comunicación intencional	0-2	El/la paciente usará gestos deícticos y referenciales (señalar con el índice, mostrar objetos, dar objetos) de forma intencional para comunicar deseos y compartir referentes.	Juego con objetos de alta motivación fuera de alcance. Modelado de gesto de señalar. Actividades de atención conjunta. Rutinas de 'dame/toma'.	Modelar el gesto de señalar en rutinas. Esperar el gesto antes de dar el objeto deseado. Leer cuentos señalando imágenes juntos.	Usa 3 gestos comunicativos diferentes en sesión de juego	Inventario de gestos comunicativos	Observar en 15 minutos de juego	\N	\N	\N	\N	Trabajar en contextos altamente motivantes. Evitar anticipar todas las necesidades del niño.	\N	2026-03-13 19:42:44.4543	pragmática	básico	activo	0	2	Atención conjunta, imitación social, contacto visual (PR-001)	Ninguno — es un objetivo pre-verbal/temprano	f	\N
58	ET-005	Desarrollar juego funcional y simbólico básico	Neurolengua	Estimulación Temprana	Primeras palabras	0-2	El/la niño/a participará en juego funcional con objetos (uso convencional) y comenzará a demostrar juego simbólico básico (hacer 'como si', dar de comer a muñeca, hablar por teléfono de juguete).	Intervención sobre vocabulario en contexto. Modelado de palabras en rutinas. Estimulación focalizada de palabras objetivo. Lectura de cuentos con denominación.	Nombrar todo el entorno durante las rutinas. Leer libros de imágenes a diario. Responder a intentos comunicativos del niño expandiendo su lenguaje.	5+ episodios de juego funcional y 2+ de juego simbólico por sesión	Escala de niveles de juego	20 minutos de juego libre observado	\N	\N	\N	\N	Usar MacArthur CDI o similar para seguimiento. Trabajar palabras de alta frecuencia en el entorno del niño.	\N	2026-03-13 19:42:44.4543	estimulación temprana	básico	activo	0	2	Balbuceo (ET-004), imitación (ET-002), atención conjunta (ET-001)	Primeras palabras emergentes (al menos 5-10 palabras), imitación presente	f	\N
136	HB-4-6-FON-M-01	Producir grupos consonánticos en posición inicial de sílaba (tr, cl, br)	Habla	Habla	Sílabas complejas	3-5	El paciente producirá palabras con grupos consonánticos de dos elementos (tren, clavo, brazo) sin simplificar la estructura silábica en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	intermedio	activo	3	5	\N	\N	f	\N
137	HB-4-6-FLU-B-01	Aplicar técnica de habla lenta y fluida en lectura oral de palabras	Habla	Habla	Fluidez	3-5	El paciente leerá listas de palabras aplicando habla lenta y continua (prolongación vocálica inicial) con menos de 3 disfluencias por cada 100 palabras.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.590596	habla	básico	activo	3	5	\N	\N	f	\N
41	MO-001	Mejorar el tono muscular labial y lingual	Neurolengua	Motricidad Orofacial	Tono muscular	3-5	El/la paciente incrementará el tono y la fuerza muscular de labios y lengua mediante ejercicios de resistencia y estimulación, observando mejora en la postura de reposo y en la articulación.	Masajes de estimulación labial y lingual. Ejercicios de soplo y succión con resistencia. Vibración táctil. Comer alimentos de diferentes texturas. Ejercicios con espátula.	Masajes faciales suaves en rutinas de higiene. Ofrecer alimentos de distintas texturas. Ejercicios de soplo lúdico (velas, molinillos).	Tono adecuado en reposo observado por el profesional en 3 sesiones consecutivas	Evaluación clínica de tono	10 repeticiones de cada ejercicio	\N	\N	\N	\N	Evitar ejercicios sin función comunicativa. Integrar con objetivos articulatorios.	\N	2026-03-13 19:42:44.4543	motricidad orofacial	básico	activo	3	5	Praxis oromotora (MO-002), deglución, articulación (HA-001)	Ninguno — es base para otros objetivos orofaciales	f	\N
43	MO-003	Establecer patrón respiratorio nasal-oral coordinado con el habla	Neurolengua	Motricidad Orofacial	Respiración	3-5	El/la paciente adoptará un patrón respiratorio adecuado al habla: inspiración nasal, espiración oral controlada, con pausas apropiadas en el discurso.	Conciencia de la respiración. Ejercicios de soplo controlado. Habla con control respiratorio en frases cortas, luego largas. Coordinación fonorrespiratoria.	Practicar soplos lentos y largos en casa. Cantar con el niño enfatizando la respiración. Actividades de relajación con foco en la respiración.	Coordinación fonorrespiratoria apropiada en habla conversacional	Observación clínica de patrón respiratorio	5 minutos de ejercicios respiratorios por sesión	\N	\N	\N	\N	Derivar a ORL si hay obstrucción nasal evidente. Coordinar con fonoaudiología de voz si hay disfonía asociada.	\N	2026-03-13 19:42:44.4543	motricidad orofacial	intermedio	activo	3	5	Tono muscular (MO-001), fluidez (HA-004), voz	Praxis básicas (MO-002), ausencia de obstrucción nasal crónica	f	\N
48	LE-004	Producir textos escritos con cohesión y coherencia básica	Neurolengua	Lectoescritura	Escritura	6-8	El/la paciente producirá textos escritos de al menos 5 oraciones con tema central identificable, uso de conectores y ortografía consistente con su nivel escolar.	Dictados progresivos. Escritura con apoyo de imagen. Corrección guiada de producciones escritas. Juegos de construcción de oraciones escritas.	Practicar escritura diaria de 3 oraciones sobre su día. Revisar juntos el uso de mayúsculas y punto final. Escribir listas de compras o tareas.	Texto de 5+ oraciones con coherencia evaluada como adecuada	Rúbrica de escritura	1 texto por sesión con revisión	\N	\N	\N	\N	Distinguir entre errores ortográficos naturales y convencionales. Priorizar ortografía natural primero.	\N	2026-03-13 19:42:44.4543	lectoescritura	avanzado	activo	6	8	Conciencia fonológica (LE-001), decodificación (LE-002), motricidad fina	Lectura de palabras regulares (LE-002), praxis grafomotriz básica	f	\N
50	CO-002	Mejorar la memoria de trabajo verbal (retención de información auditiva)	Neurolengua	Cognición	Memoria	6-8	El/la paciente repetirá correctamente secuencias de palabras y dígitos de longitud creciente (hasta 5 elementos), y recordará información verbal escuchada en contexto.	Tareas de span de dígitos con aumento gradual. Repetición de secuencias de palabras. Estrategias de agrupamiento (chunking). Juegos de memoria auditiva.	Juego de 'repite lo que digo'. Recados verbales de 2-3 elementos. Canciones con listas de elementos.	Repite 5 dígitos en orden directo en 3 de 4 intentos	Span de dígitos y palabras	10 ítems por sesión	\N	\N	\N	\N	Enseñar estrategias de codificación activa. Evaluar también memoria visual para perfil completo.	\N	2026-03-13 19:42:44.4543	cognición	intermedio	activo	6	8	Atención sostenida (CO-001), procesamiento fonológico, estrategias de codificación	Atención básica (CO-001), span mínimo de 2-3 elementos	f	\N
57	ET-004	Producir primeras palabras funcionales con intención comunicativa	Neurolengua	Estimulación Temprana	Comunicación preverbal	0-2	El/la niño/a producirá al menos 10 palabras o aproximaciones reconocibles de forma espontánea e intencional para comunicar deseos, necesidades o nombrar objetos presentes.	Estimulación vocal en rutinas. Respuesta contingente a vocalizaciones. Juegos vocales cara a cara. Canciones y rimas con vocalizaciones.	Responder contingentemente a cada vocalización del bebé. Imitar sus sonidos de vuelta. Cantar y hablar al bebé durante rutinas de cuidado.	10+ palabras o aproximaciones en inventario expresivo	Inventario expresivo de vocabulario	Registro semanal en inventario	\N	\N	\N	\N	Orientar a los padres sobre la importancia de responder a cada vocalización del bebé. Evaluar audición si no hay respuesta.	\N	2026-03-13 19:42:44.4543	estimulación temprana	básico	activo	0	2	Atención conjunta (ET-001), imitación (ET-002), precursores del lenguaje	Ninguno — objetivo para etapa pre-léxica	f	\N
101	NL-2-4-LEX-B-01	Nombrar objetos cotidianos del entorno inmediato	Lenguaje	Lenguaje	Léxico	3-5	El paciente nombrará al menos 10 objetos cotidianos (taza, silla, zapato, etc.) cuando el terapeuta los señale o presente, con un 80 % de precisión en 3 sesiones consecutivas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
102	NL-2-4-LEX-B-02	Señalar imágenes de objetos al escuchar su nombre	Lenguaje	Lenguaje	Léxico	3-5	El paciente señalará correctamente la imagen del objeto nombrado en un campo de 4 imágenes, con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
103	NL-2-4-COM-B-01	Comprender frases simples de acción (dame, pon, trae)	Lenguaje	Lenguaje	Comprensión	3-5	El paciente ejecutará consignas verbales de un paso (dame el vaso, pon la pelota) sin apoyo gestual en un 80 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
104	NL-2-4-MOR-B-01	Combinar dos palabras para expresar posesión o acción	Lenguaje	Lenguaje	Morfosintaxis	3-5	El paciente producirá combinaciones de dos palabras (mamá agua, nene come) de forma espontánea en contextos de juego, al menos 5 combinaciones diferentes por sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
105	NL-2-4-SEM-B-01	Relacionar palabras con su imagen y función en contexto	Lenguaje	Lenguaje	Semántica	3-5	El paciente asociará 10 palabras con su imagen y función cuando el terapeuta pregunte '¿para qué sirve?', completando al menos 8 de 10 en forma correcta.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
106	NL-4-6-LEX-B-01	Nombrar acciones representadas en imágenes	Lenguaje	Lenguaje	Léxico verbal	3-5	El paciente nombrará verbos de acción (correr, comer, saltar, dormir) al ver imágenes, con un 80 % de precisión en 3 sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
107	NL-4-6-LEX-B-02	Identificar categorías semánticas básicas (frutas, animales, ropa)	Lenguaje	Lenguaje	Categorías semánticas	3-5	El paciente clasificará tarjetas en al menos 5 categorías semánticas distintas, ubicando correctamente el 80 % de los ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.296664	lenguaje	básico	activo	3	5	\N	\N	f	\N
171	MO-2-4-RES-B-01	Establecer el patrón de respiración nasal en reposo	Motricidad Orofacial	Motricidad Orofacial	Respiración nasal	3-5	El paciente mantendrá la boca cerrada y la respiración nasal durante actividades sedentarias de 5 minutos, según registro del terapeuta y del familiar.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
172	MO-2-4-SUC-B-01	Eliminar hábito de succión digital o de chupete con apoyo conductual	Motricidad Orofacial	Motricidad Orofacial	Hábitos orales nocivos	3-5	El paciente reducirá el hábito de succión a menos de 1 episodio por día según reporte del familiar durante 2 semanas consecutivas, con apoyo de estrategias de sustitución.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
173	MO-2-4-MAS-B-01	Desarrollar masticación bilateral alternada con alimentos de textura blanda	Motricidad Orofacial	Motricidad Orofacial	Masticación	3-5	El paciente masticará alimentos de textura blanda usando ambos lados de la boca alternadamente, sin derramar alimento, en el 70 % de las oportunidades observadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
174	MO-4-6-TON-B-01	Fortalecer musculatura lingual mediante ejercicios de resistencia	Motricidad Orofacial	Motricidad Orofacial	Tono muscular lingual	3-5	El paciente empujará con la lengua contra una espátula durante 5 segundos en 5 repeticiones, manteniendo la posición en al menos 4 de 5 intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
175	MO-4-6-PRX-B-01	Realizar praxis linguales básicas bajo consigna verbal: sacar, subir, bajar lengua	Motricidad Orofacial	Motricidad Orofacial	Praxis linguales	3-5	El paciente ejecutará 6 praxis linguales distintas bajo consigna verbal sin imitación del terapeuta, con precisión del movimiento en el 80 % de las consignas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	básico	activo	3	5	\N	\N	f	\N
176	MO-4-6-DEG-M-01	Corregir el patrón de interposición lingual durante la deglución	Motricidad Orofacial	Motricidad Orofacial	Deglución atípica	3-5	El paciente deglutirá saliva con la lengua en posición retroalveolar (sin interposición lingual anterior) en el 80 % de los intentos observados en sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	intermedio	activo	3	5	\N	\N	f	\N
177	MO-4-6-RES-M-01	Coordinar la función respiratoria naso-oral con el habla	Motricidad Orofacial	Motricidad Orofacial	Coordinación fono-respiratoria	3-5	El paciente tomará aire antes de iniciar el enunciado y lo administrará de forma continua durante frases de 5-7 palabras, sin pausas inadecuadas por necesidad de aire, en el 75 % de las frases.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	intermedio	activo	3	5	\N	\N	f	\N
178	MO-4-6-MAS-M-01	Desarrollar masticación bilateral con alimentos de textura firme	Motricidad Orofacial	Motricidad Orofacial	Masticación	3-5	El paciente masticará alimentos de textura firme (zanahoria, manzana) usando ambos lados de forma coordinada con sellado labial, sin derramar alimento, en el 80 % de las observaciones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	intermedio	activo	3	5	\N	\N	f	\N
179	MO-4-6-TON-M-01	Mejorar el tono de mejillas y bucinadores	Motricidad Orofacial	Motricidad Orofacial	Tono muscular facial	3-5	El paciente realizará ejercicios de inflado y succión de mejillas alternados por al menos 10 repeticiones manteniendo el tono contra resistencia en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	intermedio	activo	3	5	\N	\N	f	\N
180	MO-6-8-DEG-M-01	Generalizar el patrón de deglución madura a la alimentación cotidiana	Motricidad Orofacial	Motricidad Orofacial	Generalización deglutoria	6-8	El familiar reportará uso del patrón de deglución madura en el 80 % de las comidas, con ausencia de interposición lingual anterior, verificado en sesión con alimentos sólidos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.605198	motricidad orofacial	intermedio	activo	6	8	\N	\N	f	\N
181	MO-6-8-RES-M-01	Sostener proyección de aire oral para soplar vela a 20 cm por 3 segundos	Motricidad Orofacial	Motricidad Orofacial	Soporte respiratorio oral	6-8	El paciente dirigirá y sostendrá un chorro de aire oral continuo capaz de mantener una vela inclinada a 20 cm de distancia durante 3 segundos en 3 de 5 intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	motricidad orofacial	intermedio	activo	6	8	\N	\N	f	\N
185	MO-4-6-PRX-M-01	Realizar secuencias de praxis orofaciales en orden establecido	Motricidad Orofacial	Motricidad Orofacial	Secuencias praxicas	3-5	El paciente ejecutará secuencias de 3 praxis orofaciales (labiales + linguales + mandibulares) en el orden indicado verbalmente, sin modelo visual, con 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	motricidad orofacial	intermedio	activo	3	5	\N	\N	f	\N
186	MO-6-8-PRX-M-01	Realizar praxis diadococinéticas con velocidad y precisión crecientes	Motricidad Orofacial	Motricidad Orofacial	Diadococinesia	6-8	El paciente realizará secuencias AMR (pa-pa-pa, ta-ta-ta) y SMR (pa-ta-ka) con ritmo regular y velocidad apropiada para su edad, con menos de 2 errores en 10 repeticiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	motricidad orofacial	intermedio	activo	6	8	\N	\N	f	\N
187	CG-2-4-AT-B-01	Mantener atención en una tarea estructurada por 5 minutos	Cognición	Cognición	Atención sostenida	3-5	El paciente completará actividades estructuradas (rompecabezas, encaje de formas) durante 5 minutos continuos sin distraerse ni abandonar la tarea en 3 sesiones consecutivas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	básico	activo	3	5	\N	\N	f	\N
188	CG-2-4-CAT-B-01	Clasificar objetos concretos en dos categorías según su función	Cognición	Cognición	Categorización	3-5	El paciente separará objetos de dos categorías distintas (comida vs ropa, animales vs vehículos) colocándolos en recipientes correspondientes con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	básico	activo	3	5	\N	\N	f	\N
189	CG-4-6-AT-B-01	Mantener atención selectiva ante estímulos distractores	Cognición	Cognición	Atención selectiva	3-5	El paciente realizará una tarea de selección de estímulos objetivo (marcar la letra A) ignorando distractores auditivos y visuales durante 5 minutos, con menos del 20 % de errores.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	básico	activo	3	5	\N	\N	f	\N
190	CG-4-6-CAT-B-01	Clasificar imágenes en categorías semánticas de hasta 5 grupos	Cognición	Cognición	Categorización semántica	3-5	El paciente clasificará 25 tarjetas de imágenes en 5 categorías distintas (animales, frutas, ropa, muebles, medios de transporte) con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	básico	activo	3	5	\N	\N	f	\N
191	CG-4-6-MEM-B-01	Recordar una secuencia de 3 objetos presentados visualmente	Cognición	Cognición	Memoria visual	3-5	Tras observar 3 objetos durante 10 segundos, el paciente los recordará en orden y en desorden con un 80 % de aciertos en 5 ensayos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	básico	activo	3	5	\N	\N	f	\N
192	CG-4-6-MEM-M-01	Retener y repetir secuencias de dígitos de longitud creciente	Cognición	Cognición	Memoria auditiva de trabajo	3-5	El paciente repetirá secuencias de dígitos de 3-5 elementos en orden directo e inverso, alcanzando al menos 4 dígitos directos y 3 inversos con 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	3	5	\N	\N	f	\N
193	CG-4-6-AT-M-01	Sostener la atención dividida en dos tareas simultáneas sencillas	Cognición	Cognición	Atención dividida	3-5	El paciente realizará dos tareas simultáneas de baja demanda (escuchar instrucciones y colorear) manteniendo un desempeño adecuado en ambas en al menos el 70 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	3	5	\N	\N	f	\N
194	CG-4-6-EJE-M-01	Planificar los pasos de una tarea secuencial antes de ejecutarla	Cognición	Cognición	Planificación	3-5	El paciente verbalizará los pasos necesarios para completar una tarea antes de iniciarla (armar un rompecabezas, seguir una receta sencilla) en el 75 % de las actividades propuestas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	3	5	\N	\N	f	\N
195	CG-4-6-RAZ-M-01	Identificar semejanzas y diferencias entre dos objetos o conceptos	Cognición	Cognición	Razonamiento comparativo	3-5	El paciente identificará al menos 2 semejanzas y 2 diferencias entre pares de objetos o animales cuando el terapeuta se los presente, con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	3	5	\N	\N	f	\N
196	CG-6-8-AT-M-01	Mantener atención sostenida durante actividades académicas por 15 minutos	Cognición	Cognición	Atención sostenida	6-8	El paciente completará actividades académicas estructuradas (copia, lectura guiada) durante 15 minutos continuos con menos de 3 interrupciones por distracción, en 3 sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	6	8	\N	\N	f	\N
197	CG-6-8-MEM-M-01	Usar estrategias de memorización (repetición, agrupamiento) para recordar listas	Cognición	Cognición	Estrategias mnemónicas	6-8	El paciente aplicará al menos una estrategia de memorización (repetición en voz alta, agrupamiento por categoría) para recordar listas de 7-9 ítems con un 80 % de retención al cabo de 5 minutos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	6	8	\N	\N	f	\N
198	CG-6-8-EJE-M-01	Monitorizar y corregir errores propios durante la ejecución de una tarea	Cognición	Cognición	Monitoreo ejecutivo	6-8	El paciente detectará y corregirá al menos el 70 % de sus propios errores en tareas académicas sin señalización del terapeuta, usando estrategias de autocorrección.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	6	8	\N	\N	f	\N
199	CG-6-8-EJE-A-01	Establecer metas y organizar pasos para completar un proyecto	Cognición	Cognición	Funciones ejecutivas	6-8	El paciente planificará un proyecto simple (preparar una presentación, organizar un cuento) definiendo 3-4 pasos con secuencia lógica y ejecutándolos con supervisión mínima.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	avanzado	activo	6	8	\N	\N	f	\N
200	CG-6-8-RAZ-M-01	Resolver problemas lógicos de clasificación y serie de patrones	Cognición	Cognición	Razonamiento lógico	6-8	El paciente completará series de patrones y clasificaciones lógicas (matrices, analogías visuales) con un 80 % de aciertos en actividades de nivel escolar.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.611776	cognición	intermedio	activo	6	8	\N	\N	f	\N
201	CG-6-8-RAZ-A-01	Inferir causa y efecto en situaciones cotidianas y académicas	Cognición	Cognición	Razonamiento causal	6-8	El paciente explicará la relación de causa-efecto en situaciones cotidianas y textos leídos, identificando correctamente la causa y consecuencia en el 80 % de los ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	cognición	avanzado	activo	6	8	\N	\N	f	\N
202	CG-6-8-MEM-A-01	Recuperar información de la memoria a largo plazo para resolver tareas escolares	Cognición	Cognición	Memoria a largo plazo	6-8	El paciente recuperará información aprendida en sesiones previas (vocabulario, reglas, procedimientos) para aplicarla en tareas nuevas con un 80 % de aciertos sin pistas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	cognición	avanzado	activo	6	8	\N	\N	f	\N
203	CG-4-6-EJE-M-02	Inhibir respuesta prepotente ante señal de parada (go/no-go)	Cognición	Cognición	Control inhibitorio	3-5	En tareas tipo go/no-go, el paciente inhibirá su respuesta ante la señal de parada en al menos el 75 % de los ensayos de señal de parada dentro de un bloque de 20 intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	cognición	intermedio	activo	3	5	\N	\N	f	\N
204	CG-6-8-EJE-M-02	Mantener la flexibilidad cognitiva al cambiar de regla en una tarea	Cognición	Cognición	Flexibilidad cognitiva	6-8	El paciente cambiará de regla de clasificación (de color a forma a cantidad) en una tarea de cartas al menos 3 veces sin perseveración de errores mayor al 20 %.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	cognición	intermedio	activo	6	8	\N	\N	f	\N
205	LE-4-6-CON-B-01	Segmentar palabras en sílabas con palmadas	Lectoescritura	Lectoescritura	Conciencia silábica	3-5	El paciente segmentará palabras de 2-4 sílabas en sílabas usando palmadas, con un 80 % de precisión en una lista de 20 palabras presentadas oralmente.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	básico	activo	3	5	\N	\N	f	\N
206	LE-4-6-CON-B-02	Identificar la sílaba inicial y final de palabras	Lectoescritura	Lectoescritura	Conciencia silábica	3-5	El paciente identificará la sílaba inicial y final de palabras dichas por el terapeuta con un 80 % de aciertos en 20 palabras de distinta estructura silábica.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	básico	activo	3	5	\N	\N	f	\N
207	LE-4-6-CON-M-01	Identificar y manipular fonemas iniciales en palabras (segmentación fonémica)	Lectoescritura	Lectoescritura	Conciencia fonémica	3-5	El paciente identificará el fonema inicial de palabras cortas y buscará otras palabras que empiecen igual, con un 80 % de aciertos en 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	3	5	\N	\N	f	\N
208	LE-4-6-LEC-B-01	Reconocer las letras del alfabeto por su nombre y sonido	Lectoescritura	Lectoescritura	Conocimiento alfabético	3-5	El paciente nombrará correctamente al menos 20 de las 27 letras del alfabeto en orden y fuera de orden, y producirá el sonido asociado a 15 letras.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	básico	activo	3	5	\N	\N	f	\N
209	LE-4-6-LEC-M-01	Leer palabras bisílabas de alta frecuencia de forma global	Lectoescritura	Lectoescritura	Lectura de palabras	3-5	El paciente leerá correctamente al menos 20 palabras bisílabas de alta frecuencia (casa, perro, mesa, niña) de forma global o decodificada con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	3	5	\N	\N	f	\N
210	LE-4-6-ESC-B-01	Copiar su nombre y palabras simples con letra clara y orientada	Lectoescritura	Lectoescritura	Escritura copiada	3-5	El paciente copiará su nombre propio y 5 palabras simples con letras reconocibles, orientadas correctamente y dentro del renglón en el 80 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	básico	activo	3	5	\N	\N	f	\N
211	LE-6-8-CON-M-01	Agregar, omitir y sustituir fonemas en palabras (manipulación fonémica)	Lectoescritura	Lectoescritura	Conciencia fonémica avanzada	6-8	El paciente realizará tareas de omisión (silla sin /s/ = illa), sustitución (pala → bala) y adición de fonemas con un 80 % de aciertos en 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	6	8	\N	\N	f	\N
212	LE-6-8-LEC-M-01	Leer oraciones simples con comprensión literal	Lectoescritura	Lectoescritura	Comprensión lectora	6-8	El paciente leerá oraciones de 6-10 palabras y responderá preguntas literales (quién, qué, dónde) con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	6	8	\N	\N	f	\N
213	LE-6-8-LEC-M-02	Leer en voz alta con fluidez y precisión textos de nivel 1.º grado	Lectoescritura	Lectoescritura	Fluidez lectora	6-8	El paciente leerá en voz alta textos adecuados a su nivel con menos del 5 % de errores de decodificación y una velocidad de al menos 40 palabras por minuto.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	6	8	\N	\N	f	\N
214	LE-6-8-ESC-M-01	Escribir oraciones simples con ortografía natural correcta	Lectoescritura	Lectoescritura	Escritura de oraciones	6-8	El paciente escribirá oraciones de 5-7 palabras al dictado con mayúscula inicial, punto final y ortografía natural correcta (sin errores de correspondencia fonema-grafema) en el 80 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	6	8	\N	\N	f	\N
215	LE-6-8-ESC-A-01	Producir textos escritos breves con estructura narrativa	Lectoescritura	Lectoescritura	Producción textual	6-8	El paciente escribirá un texto narrativo breve (mínimo 5 oraciones) con inicio, desarrollo y desenlace, con cohesión temática y ortografía natural aceptable.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	avanzado	activo	6	8	\N	\N	f	\N
216	LE-6-8-LEC-A-01	Comprender textos informativos respondiendo preguntas inferenciales	Lectoescritura	Lectoescritura	Comprensión inferencial	6-8	Tras leer un texto informativo breve, el paciente responderá preguntas que requieran inferencia (por qué, qué habría pasado si, cuál es la idea principal) con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	avanzado	activo	6	8	\N	\N	f	\N
217	LE-6-8-CON-A-01	Segmentar completamente palabras en fonemas y deletrearlas correctamente	Lectoescritura	Lectoescritura	Segmentación fonémica	6-8	El paciente segmentará palabras de 4-6 fonemas en sus componentes individuales y deletreará palabras familiares e inusales con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	avanzado	activo	6	8	\N	\N	f	\N
218	LE-4-6-ESC-M-01	Escribir palabras de 2-3 sílabas al dictado	Lectoescritura	Lectoescritura	Escritura al dictado	3-5	El paciente escribirá correctamente palabras de 2-3 sílabas dictadas por el terapeuta con un 75 % de aciertos, respetando la correspondencia fonema-grafema básica.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	3	5	\N	\N	f	\N
219	LE-6-8-ESC-M-02	Usar mayúsculas y puntuación básica en textos escritos	Lectoescritura	Lectoescritura	Ortografía y puntuación	6-8	El paciente usará mayúsculas al inicio de oración y tras punto, más punto final y coma en enumeraciones simples, en el 80 % de las oraciones de sus producciones escritas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	lectoescritura	intermedio	activo	6	8	\N	\N	f	\N
220	ET-0-2-AT-B-01	Mantener contacto visual con el cuidador durante el juego cara a cara	Estimulación Temprana	Estimulación Temprana	Atención conjunta	0-2	El niño mantendrá contacto visual con el cuidador durante episodios de juego cara a cara por al menos 3 segundos continuos en el 70 % de las oportunidades presentadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.617458	estimulación temprana	básico	activo	0	2	\N	\N	f	\N
221	ET-0-2-IMI-B-01	Imitar gestos faciales simples del adulto (sacar la lengua, abrir la boca)	Estimulación Temprana	Estimulación Temprana	Imitación gestual	0-2	El niño imitará al menos 3 gestos faciales del adulto (sacar la lengua, sonrisa, abrir la boca) en el 70 % de las oportunidades durante el juego cara a cara.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	0	2	\N	\N	f	\N
222	ET-0-2-PRV-B-01	Vocalizar en respuesta a la voz del adulto (protoconversación)	Estimulación Temprana	Estimulación Temprana	Comunicación preverbal	0-2	El niño responderá vocalmente al habla del adulto durante intercambios de protoconversación, alternando las vocalizaciones con las del adulto en el 70 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	0	2	\N	\N	f	\N
223	ET-0-2-SEN-B-01	Responder a la estimulación táctil y auditiva del entorno	Estimulación Temprana	Estimulación Temprana	Integración sensorial	0-2	El niño responderá con orientación de cabeza, expresión facial o movimiento corporal a estímulos auditivos (voz, música) y táctiles (texturas) presentados por el cuidador en el 75 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	0	2	\N	\N	f	\N
224	ET-0-2-INT-B-01	Sonreír en respuesta a la voz y el rostro del cuidador principal	Estimulación Temprana	Estimulación Temprana	Vínculo e interacción	0-2	El niño responderá con sonrisa social a la voz y el rostro del cuidador en el 75 % de las situaciones de interacción directa, sin estimulación táctil como única activadora.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	0	2	\N	\N	f	\N
225	ET-2-4-AT-B-01	Seguir la mirada del adulto para atender a un objeto de interés	Estimulación Temprana	Estimulación Temprana	Seguimiento de mirada	3-5	El niño seguirá la dirección de la mirada del adulto para localizar un objeto en el campo visual en el 75 % de los intentos, sin que el adulto señale con el dedo.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
226	ET-2-4-IMI-B-01	Imitar acciones con objetos durante el juego funcional	Estimulación Temprana	Estimulación Temprana	Imitación de acciones	3-5	El niño imitará 5 acciones con objetos (empujar un carro, darle de comer a un muñeco, apilar bloques) demostradas por el adulto con un 80 % de fidelidad en el gesto imitado.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
227	ET-2-4-JUE-B-01	Participar en juego funcional con objetos: usar cada objeto según su función	Estimulación Temprana	Estimulación Temprana	Juego funcional	3-5	El niño usará al menos 5 objetos según su función convencional (cuchara para comer, teléfono para hablar, cepillo para peinar) de forma espontánea durante el juego.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
228	ET-2-4-JUE-M-01	Desarrollar juego simbólico simple con muñecos y figuras	Estimulación Temprana	Estimulación Temprana	Juego simbólico	3-5	El niño realizará secuencias de 2-3 acciones simbólicas con muñecos (darle de comer, acostarlos, bañarlos) de forma espontánea durante el juego libre en la sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	intermedio	activo	3	5	\N	\N	f	\N
229	ET-2-4-COM-B-01	Comprender palabras de uso cotidiano en el contexto familiar	Estimulación Temprana	Estimulación Temprana	Comprensión léxica temprana	3-5	El niño señalará o irá hacia el objeto/persona nombrado por el adulto (leche, mamá, zapato, pelota) en el 80 % de las oportunidades dentro del contexto familiar cotidiano.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
230	ET-2-4-PRV-B-01	Producir primeras palabras con intención comunicativa clara	Estimulación Temprana	Estimulación Temprana	Primeras palabras	3-5	El niño producirá al menos 10 palabras distintas de forma consistente y con intención comunicativa (nombrar, pedir, rechazar) en contextos espontáneos, según reporte del familiar.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
231	ET-2-4-VIN-B-01	Buscar consuelo y regulación emocional activamente con el cuidador	Estimulación Temprana	Estimulación Temprana	Vínculo de apego	3-5	El niño buscará activamente al cuidador ante situaciones de malestar (llanto, miedo) acercándose físicamente o llamándolo verbalmente en el 80 % de las situaciones de estrés observadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
232	ET-2-4-SEN-B-01	Tolerar texturas y sensaciones táctiles variadas durante el juego	Estimulación Temprana	Estimulación Temprana	Procesamiento sensorial	3-5	El niño tolerará explorar materiales de texturas variadas (arena, plastilina, materiales suaves y rugosos) durante al menos 5 minutos sin conductas de rechazo intensas, según observación del terapeuta.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	básico	activo	3	5	\N	\N	f	\N
233	ET-2-4-COM-M-01	Comprender preguntas simples (¿qué es? ¿dónde está?) sin apoyo gestual	Estimulación Temprana	Estimulación Temprana	Comprensión de preguntas	3-5	El niño responderá apropiadamente a preguntas simples (¿qué es esto? ¿dónde está la pelota?) señalando o nombrando, en el 75 % de los intentos sin que el adulto use gestos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	intermedio	activo	3	5	\N	\N	f	\N
234	ET-2-4-JUE-M-02	Participar en juego de roles simples con un adulto	Estimulación Temprana	Estimulación Temprana	Juego de roles	3-5	El niño asumirá un rol en un juego simbólico con el adulto (cocinar, ser médico, ir de compras) realizando al menos 3 acciones de rol diferentes de forma espontánea.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	intermedio	activo	3	5	\N	\N	f	\N
235	ET-2-4-AT-M-01	Coordinar atención entre el adulto y el objeto de manera triádica	Estimulación Temprana	Estimulación Temprana	Atención conjunta triádica	3-5	El niño alternará la mirada entre el adulto y el objeto de juego para compartir el interés, haciendo al menos 3 turnos de alternancia de mirada por episodio de juego compartido.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 18:53:48.622079	estimulación temprana	intermedio	activo	3	5	\N	\N	f	\N
236	LN-2-4-COM-B-01	Comprender el nombre de partes del cuerpo	Lenguaje	Lenguaje	Comprensión	3-5	El paciente señalará correctamente al menos 10 partes del cuerpo (cabeza, ojos, nariz, boca, manos, pies, barriga, orejas, pelo, piernas) al escuchar su nombre, con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
237	LN-2-4-COM-B-02	Identificar objetos del entorno familiar por su nombre	Lenguaje	Lenguaje	Comprensión	3-5	El paciente señalará o tomará el objeto nombrado por el terapeuta dentro de un set de 4 objetos del hogar, logrando el 80 % de aciertos en 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
238	LN-2-4-COM-B-03	Comprender conceptos de cantidad: uno y muchos	Lenguaje	Lenguaje	Comprensión	3-5	El paciente diferenciará entre 'uno' y 'muchos' al manipular objetos concretos, entregando la cantidad indicada con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
239	LN-4-6-COM-B-01	Comprender preguntas ¿quién?, ¿qué? y ¿dónde? en relatos escuchados	Lenguaje	Lenguaje	Comprensión	3-5	Tras escuchar un relato breve de 5-7 oraciones, el paciente responderá correctamente preguntas de tipo ¿quién?, ¿qué hizo? y ¿dónde? en el 80 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
240	LN-4-6-COM-B-02	Comprender conceptos espaciales básicos: arriba, abajo, dentro, fuera	Lenguaje	Lenguaje	Comprensión	3-5	El paciente colocará un objeto en la posición indicada verbalmente (arriba de la caja, dentro del aro) con un 80 % de aciertos en 20 consignas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
241	LN-4-6-COM-B-03	Comprender conceptos temporales: antes, ahora y después	Lenguaje	Lenguaje	Comprensión	3-5	El paciente ordenará y responderá sobre secuencias de 3 eventos cotidianos usando los conceptos antes, ahora y después con un 75 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
242	LN-4-6-COM-M-01	Comprender instrucciones con negación y condición simple	Lenguaje	Lenguaje	Comprensión	3-5	El paciente ejecutará instrucciones que incluyan negación ('no toques el rojo') y condición simple ('si la ficha es azul, ponla aquí') con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
243	LN-4-6-COM-M-02	Comprender oraciones en voz pasiva simple	Lenguaje	Lenguaje	Comprensión	3-5	El paciente señalará la imagen correcta que corresponde a una oración en voz pasiva ('el perro es perseguido por el gato') en el 75 % de los ítems de un set de 20.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
244	LN-6-8-COM-M-01	Comprender textos narrativos respondiendo preguntas literales e inferenciales	Lenguaje	Lenguaje	Comprensión	6-8	Tras escuchar un texto narrativo de nivel escolar, el paciente responderá 4 preguntas literales y 2 inferenciales con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
247	LN-6-8-COM-A-01	Realizar inferencias elaborativas en textos complejos	Lenguaje	Lenguaje	Comprensión	6-8	El paciente generará inferencias elaborativas (predicciones, explicaciones) a partir de textos de ficción y no ficción con justificación coherente en el 75 % de los ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
248	LN-6-8-COM-A-02	Comprender lenguaje figurado en contextos humorísticos	Lenguaje	Lenguaje	Comprensión	6-8	El paciente explicará el significado de chistes y juegos de palabras identificando el elemento inesperado que genera el humor, con un 75 % de aciertos en 8 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
249	LN-8-10-COM-M-01	Comprender textos argumentativos identificando posición y argumentos	Lenguaje	Lenguaje	Comprensión	9-12	Tras leer un texto argumentativo, el paciente identificará la posición del autor y al menos 2 argumentos que la sostienen, con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	9	12	\N	\N	f	\N
250	LN-8-10-COM-M-02	Sintetizar información de múltiples fuentes orales en un resumen	Lenguaje	Lenguaje	Comprensión	9-12	El paciente escuchará dos fuentes de información sobre el mismo tema y sintetizará los puntos clave en un resumen oral coherente de al menos 5 oraciones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	9	12	\N	\N	f	\N
251	LN-8-10-COM-A-01	Evaluar críticamente el contenido y la forma de un discurso escuchado	Lenguaje	Lenguaje	Comprensión	9-12	El paciente identificará puntos fuertes y débiles de un discurso escuchado y expresará una evaluación justificada usando lenguaje valorativo apropiado.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
252	LN-2-4-EXP-B-01	Producir holofrasas para expresar intenciones comunicativas	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente producirá palabras aisladas con función de frase (agua para pedir, no para rechazar, papá para llamar) en contextos funcionales en el 75 % de las oportunidades comunicativas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
253	LN-2-4-EXP-B-02	Producir combinaciones de dos palabras para pedir y comentar	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente producirá al menos 10 combinaciones distintas de dos palabras de forma espontánea (más jugo, papá come, pelota aquí) durante sesiones de juego libre.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
254	LN-2-4-EXP-B-03	Denominar imágenes de objetos, animales y personas del entorno cercano	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente nombrará correctamente al menos 20 imágenes de objetos, animales y personas del entorno cotidiano cuando se le presenten sin apoyo, con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
255	LN-4-6-EXP-B-01	Producir frases de 3-4 palabras describiendo imágenes	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente producirá frases de al menos 3 palabras (la niña come manzana) al describir imágenes de situaciones, en el 80 % de las oportunidades con modelos disponibles.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
256	LN-4-6-EXP-B-02	Responder preguntas simples con oraciones completas	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente responderá preguntas ¿qué?, ¿quién?, ¿dónde? con oraciones completas de al menos 3 palabras sin reducir a respuestas de una sola palabra, en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	básico	activo	3	5	\N	\N	f	\N
257	LN-4-6-EXP-M-01	Describir un evento cotidiano usando oraciones coordinadas	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente describirá un evento (cómo fue el recreo, qué hizo el fin de semana) usando al menos 3 oraciones coordinadas con 'y', 'pero' o 'entonces' de forma espontánea.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
258	LN-4-6-EXP-M-02	Formular preguntas para obtener información desconocida	Lenguaje	Lenguaje	Lenguaje expresivo	3-5	El paciente formulará preguntas con ¿por qué?, ¿cómo? y ¿cuándo? de forma espontánea para obtener información que desconoce, al menos 3 preguntas distintas por sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
259	LN-6-8-EXP-M-01	Describir procedimientos en secuencia lógica paso a paso	Lenguaje	Lenguaje	Lenguaje expresivo	6-8	El paciente explicará cómo realizar una actividad conocida (preparar un sándwich, jugar a un juego) usando al menos 4 pasos ordenados con marcadores secuenciales (primero, luego, después, finalmente).	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
260	LN-6-8-EXP-M-02	Expresar opiniones y justificarlas con argumentos simples	Lenguaje	Lenguaje	Lenguaje expresivo	6-8	El paciente expresará su opinión sobre un tema y la justificará con al menos 2 razones coherentes usando la estructura 'creo que... porque...' en el 75 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:35.969594	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
261	LN-6-8-EXP-A-01	Producir discurso oral estructurado sobre un tema de interés por 3 minutos	Lenguaje	Lenguaje	Lenguaje expresivo	6-8	El paciente expondrá un tema de su elección durante 3 minutos con introducción, desarrollo de al menos 3 puntos y conclusión, usando vocabulario preciso y manteniendo la cohesión temática.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
262	LN-8-10-EXP-A-01	Presentar un argumento oral con evidencias y refutación	Lenguaje	Lenguaje	Lenguaje expresivo	9-12	El paciente presentará un argumento oral con al menos 3 evidencias que lo sostengan y anticipará y refutará una posible objeción, usando conectores argumentativos apropiados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
263	LN-4-6-NAR-B-01	Secuenciar 3 imágenes de una historia y verbalizarlas en orden	Lenguaje	Lenguaje	Narrativo	3-5	El paciente ordenará 3 imágenes de una secuencia narrativa y narrará lo que ocurre en cada una con al menos una oración por imagen y orden temporal correcto.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
264	LN-4-6-NAR-B-02	Retell de un cuento corto después de escucharlo	Lenguaje	Lenguaje	Narrativo	3-5	Tras escuchar un cuento de 5-7 oraciones, el paciente lo relatará incluyendo al menos el personaje principal, la acción central y el desenlace, con apoyo de preguntas guía si es necesario.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
265	LN-4-6-NAR-M-01	Narrar cuentos con estructura completa: personaje, problema y resolución	Lenguaje	Lenguaje	Narrativo	3-5	El paciente narrará una historia a partir de imágenes o de forma espontánea incluyendo al menos: presentación del personaje, descripción de un problema y su resolución, usando conectores temporales básicos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
266	LN-6-8-NAR-M-01	Narrar experiencias con perspectiva emocional de los personajes	Lenguaje	Lenguaje	Narrativo	6-8	El paciente narrará una experiencia personal o cuento incluyendo referencias a los estados internos (emociones, pensamientos, deseos) de al menos un personaje en el 75 % de las narrativas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
267	LN-6-8-NAR-M-02	Producir narrativas con estructura completa de episodio múltiple	Lenguaje	Lenguaje	Narrativo	6-8	El paciente narrará historias con al menos 2 episodios, cada uno con su propio inicio, problema y resolución, usando conectores causales y temporales para vincularlos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
268	LN-6-8-NAR-A-01	Crear narraciones originales con tema, tono y audiencia definidos	Lenguaje	Lenguaje	Narrativo	6-8	El paciente creará una historia original adecuando el tipo de narración (cuento, relato de aventuras, historia de miedo) al oyente, con vocabulario y tono coherentes con la temática.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
269	LN-6-8-NAR-A-02	Analizar la estructura narrativa de textos literarios escuchados	Lenguaje	Lenguaje	Narrativo	6-8	El paciente identificará y comentará los elementos estructurales (inicio, conflicto, clímax, desenlace) y los recursos literarios (personificación, hipérbole) de cuentos escuchados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
270	LN-8-10-NAR-A-01	Producir narraciones con voz narrativa consistente y recursos literarios	Lenguaje	Lenguaje	Narrativo	9-12	El paciente producirá narraciones orales o escritas manteniendo una voz narrativa consistente e incorporando al menos 2 recursos literarios (comparación, metáfora, repetición) de forma intencional.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
271	LN-8-10-NAR-A-02	Recontar y transformar textos narrativos cambiando el punto de vista	Lenguaje	Lenguaje	Narrativo	9-12	El paciente recontará un cuento conocido desde la perspectiva de un personaje secundario, ajustando la información disponible y las actitudes del narrador de forma coherente.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
272	LN-2-4-VOC-B-01	Adquirir vocabulario de palabras de acción (verbos de alta frecuencia)	Lenguaje	Lenguaje	Vocabulario	3-5	El paciente nombrará y ejecutará al menos 15 verbos de acción frecuentes (correr, saltar, comer, dormir, beber, jugar, cantar, bailar, lavar, dibujar, leer, empujar, tirar, abrir, cerrar) al ser mostrados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
273	LN-2-4-VOC-B-02	Comprender y usar palabras de los campos semánticos básicos	Lenguaje	Lenguaje	Vocabulario	3-5	El paciente reconocerá y usará al menos 5 palabras de cada uno de 4 campos semánticos (alimentos, animales, ropa, juguetes) tanto para señalar como para nombrar.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
274	LN-4-6-VOC-B-01	Usar adjetivos descriptivos de tamaño, color y forma	Lenguaje	Lenguaje	Vocabulario	3-5	El paciente usará adjetivos de tamaño (grande/pequeño), color (8 colores básicos) y forma (redondo, cuadrado, triangular) correctamente al describir objetos, con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
275	LN-4-6-VOC-B-02	Adquirir vocabulario de emociones básicas	Lenguaje	Lenguaje	Vocabulario	3-5	El paciente nombrará y reconocerá en expresiones faciales al menos 6 emociones básicas (feliz, triste, enojado, asustado, sorprendido, disgustado) con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
276	LN-4-6-VOC-M-01	Usar vocabulario relacional: comparativos y superlativos	Lenguaje	Lenguaje	Vocabulario	3-5	El paciente usará comparativos (más grande que, más rápido que) y superlativos (el más alto, la más pequeña) correctamente al comparar objetos o imágenes, con un 75 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
277	LN-6-8-VOC-M-01	Usar vocabulario académico de ciencias naturales y sociales	Lenguaje	Lenguaje	Vocabulario	6-8	El paciente comprenderá y usará al menos 20 palabras del vocabulario escolar de ciencias naturales y sociales (ecosistema, hábitat, territorio, recurso, etc.) en contextos académicos con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
278	LN-6-8-VOC-M-02	Inferir el significado de palabras desconocidas por contexto	Lenguaje	Lenguaje	Vocabulario	6-8	El paciente inferirá el significado aproximado de palabras nuevas en textos orales y escritos usando pistas contextuales, con una paráfrasis ajustada en el 75 % de los ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
279	LN-6-8-VOC-A-01	Usar vocabulario emocional y psicológico complejo	Lenguaje	Lenguaje	Vocabulario	6-8	El paciente usará vocabulario para describir estados internos complejos (frustración, entusiasmo, nostalgia, empatía, ambivalencia) en contextos conversacionales apropiados con un 75 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
280	LN-8-10-VOC-A-01	Usar vocabulario figurado y recursos retóricos en discurso oral	Lenguaje	Lenguaje	Vocabulario	9-12	El paciente incorporará al menos 2 recursos retóricos (metáfora, comparación, hipérbole) en su producción oral espontánea de forma intencional y apropiada al contexto.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
281	LN-2-4-GRM-B-01	Usar morfemas de número (singular/plural) en la producción oral	Lenguaje	Lenguaje	Gramática	3-5	El paciente usará la forma de plural (perros, casas, sillas) correctamente cuando sea apropiado en su producción espontánea, con un 75 % de precisión en una muestra de habla.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
282	LN-4-6-GRM-B-01	Usar correctamente el tiempo verbal presente en oraciones	Lenguaje	Lenguaje	Gramática	3-5	El paciente producirá verbos en presente indicativo con concordancia de persona y número correcta (él come, nosotros jugamos) en el 80 % de las producciones espontáneas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
283	LN-4-6-GRM-B-02	Usar preposiciones de lugar en descripciones espontáneas	Lenguaje	Lenguaje	Gramática	3-5	El paciente usará correctamente preposiciones de lugar (en, sobre, debajo, detrás, delante, entre) en descripciones espontáneas de imágenes con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	básico	activo	3	5	\N	\N	f	\N
284	LN-4-6-GRM-M-01	Conjugar verbos regulares en tiempo pasado con precisión	Lenguaje	Lenguaje	Gramática	3-5	El paciente conjugará verbos regulares en pretérito perfecto simple (-é, -aste, -ó) con concordancia de persona y número en el 80 % de las producciones en tareas de narración.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	3	5	\N	\N	f	\N
285	LN-6-8-GRM-M-01	Producir oraciones con pronombres personales y posesivos correctamente	Lenguaje	Lenguaje	Gramática	6-8	El paciente usará pronombres personales (yo, tú, él, ella, nosotros) y posesivos (mi, tu, su, nuestro) correctamente con concordancia de género y número en el 80 % de las producciones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.32066	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
286	LN-6-8-GRM-M-02	Usar oraciones con cláusulas relativas para expandir el léxico	Lenguaje	Lenguaje	Gramática	6-8	El paciente producirá oraciones con cláusulas relativas simples (el niño que corre, la caja que está rota) con concordancia correcta en el 75 % de sus producciones narrativas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
287	LN-6-8-GRM-A-01	Usar marcadores discursivos para conectar enunciados en el discurso	Lenguaje	Lenguaje	Gramática	6-8	El paciente usará al menos 6 tipos de marcadores discursivos distintos (causa, consecuencia, contraste, adición, tiempo, conclusión) de forma apropiada y variada en el discurso oral.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
288	LN-8-10-GRM-A-01	Usar construcciones sintácticas complejas: subjuntivo y condicional	Lenguaje	Lenguaje	Gramática	9-12	El paciente usará el modo subjuntivo (es posible que venga) y el condicional (si tuviera tiempo, iría) en contextos comunicativos apropiados con un 75 % de precisión morfológica.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
289	LN-8-10-GRM-A-02	Autocorregir errores gramaticales en el habla con monitoreo activo	Lenguaje	Lenguaje	Gramática	9-12	El paciente detectará y corregirá de forma espontánea al menos el 70 % de sus propios errores gramaticales en el habla sin señalización del terapeuta.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
290	LN-4-6-PRG-B-01	Usar fórmulas de cortesía situacional de forma apropiada	Lenguaje	Lenguaje	Pragmática lingüística	3-5	El paciente usará fórmulas de cortesía (buenos días, por favor, gracias, perdón, hasta luego) de forma espontánea y contextualmente adecuada en el 80 % de las situaciones que las requieren.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	básico	activo	3	5	\N	\N	f	\N
291	LN-4-6-PRG-B-02	Ajustar el volumen y el tono de voz al contexto comunicativo	Lenguaje	Lenguaje	Pragmática lingüística	3-5	El paciente ajustará el volumen e intensidad de voz en situaciones de voz baja (biblioteca, dormitorio) y normal (patio, juego) cuando se le indique, con respuesta apropiada en el 80 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	básico	activo	3	5	\N	\N	f	\N
292	LN-6-8-PRG-M-01	Usar lenguaje literal vs. figurado según el contexto comunicativo	Lenguaje	Lenguaje	Pragmática lingüística	6-8	El paciente diferenciará situaciones que requieren lenguaje literal vs. figurado y seleccionará la forma apropiada en juegos de roles y situaciones comunicativas estructuradas con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
293	LN-6-8-PRG-M-02	Usar implicaturas conversacionales en el intercambio comunicativo	Lenguaje	Lenguaje	Pragmática lingüística	6-8	El paciente interpretará correctamente implicaturas conversacionales (cuando alguien dice 'hace mucho calor aquí' quiere que abran la ventana) en el 70 % de los escenarios presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	intermedio	activo	6	8	\N	\N	f	\N
294	LN-6-8-PRG-A-01	Reconocer y usar actos de habla indirectos en contextos sociales	Lenguaje	Lenguaje	Pragmática lingüística	6-8	El paciente identificará la función comunicativa de actos de habla indirectos (peticiones disfrazadas, rechazos corteses) y los producirá apropiadamente en juegos de rol en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	avanzado	activo	6	8	\N	\N	f	\N
295	LN-8-10-PRG-A-01	Adaptar el discurso al registro formal para contextos académicos	Lenguaje	Lenguaje	Pragmática lingüística	9-12	El paciente producirá presentaciones orales en registro formal (vocabulario técnico, oraciones completas, sin muletillas) distinguible del registro informal en situaciones de juego de roles académicos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	lenguaje	avanzado	activo	9	12	\N	\N	f	\N
296	CG-2-4-WME-B-01	Recordar y ejecutar instrucciones de dos pasos con demora	Cognición	Cognición	Memoria de trabajo	3-5	El paciente recordará y ejecutará una instrucción de dos pasos (toma la pelota y ponla en la caja) después de una pausa de 5 segundos, con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
297	CG-2-4-WME-B-02	Reproducir secuencias visoespaciales simples de 2-3 pasos	Cognición	Cognición	Memoria de trabajo	3-5	El paciente reproducirá una secuencia de 2-3 toques en bloques de colores después de observarla, con un 80 % de aciertos en 10 ensayos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
298	CG-4-6-WME-B-01	Retener en mente 3 ítems mientras realiza una tarea secundaria	Cognición	Cognición	Memoria de trabajo	3-5	El paciente recordará 3 palabras o imágenes presentadas al inicio de una actividad y las reportará correctamente al finalizar la tarea con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
299	CG-4-6-WME-B-02	Repetir secuencias de colores en orden directo e inverso	Cognición	Cognición	Memoria de trabajo	3-5	El paciente repetirá secuencias de 3-4 colores en orden directo (como se presentaron) e inverso (al revés), con un 80 % de aciertos en series de 3 y 75 % en series de 4.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
300	CG-4-6-WME-M-01	Mantener activa información mientras transforma o manipula datos	Cognición	Cognición	Memoria de trabajo	3-5	El paciente realizará tareas de n-back simple (indicar si el estímulo actual coincide con el anterior) con un 75 % de aciertos en una serie de 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	intermedio	activo	3	5	\N	\N	f	\N
301	CG-4-6-WME-M-02	Recordar y aplicar reglas de una tarea mientras la ejecuta	Cognición	Cognición	Memoria de trabajo	3-5	El paciente mantendrá activas 2-3 reglas de clasificación (si es rojo va acá, si es grande va allá) mientras categoriza un set de estímulos, con menos del 20 % de errores.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	intermedio	activo	3	5	\N	\N	f	\N
302	CG-6-8-WME-M-01	Realizar cálculo mental sencillo manteniendo números intermedios	Cognición	Cognición	Memoria de trabajo	6-8	El paciente resolverá sumas y restas de dos pasos de forma mental (sin papel), reteniendo los resultados intermedios y produciendo el resultado final con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	intermedio	activo	6	8	\N	\N	f	\N
303	CG-6-8-WME-M-02	Actualizar continuamente la información en tareas de monitoreo	Cognición	Cognición	Memoria de trabajo	6-8	El paciente actualizará activamente información cambiante durante tareas de seguimiento (recordar la última palabra de una lista en expansión) con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	intermedio	activo	6	8	\N	\N	f	\N
304	CG-6-8-WME-A-01	Usar la memoria de trabajo para planificar una estrategia de juego	Cognición	Cognición	Memoria de trabajo	6-8	El paciente mantendrá en mente el estado actual del juego y planificará al menos 2 movimientos futuros en juegos de estrategia simple (damas, tres en raya) sin referencia física al tablero.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	avanzado	activo	6	8	\N	\N	f	\N
305	CG-8-10-WME-A-01	Retener y manipular secuencias de información compleja	Cognición	Cognición	Memoria de trabajo	9-12	El paciente recordará y reorganizará listas de 6-7 ítems (ordenar palabras alfabéticamente en la mente, ordenar números de mayor a menor) con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	avanzado	activo	9	12	\N	\N	f	\N
306	CG-8-10-WME-A-02	Aplicar la memoria de trabajo en tareas de comprensión lectora compleja	Cognición	Cognición	Memoria de trabajo	9-12	El paciente mantendrá información de párrafos anteriores activa mientras lee textos complejos, integrando información a lo largo del texto para responder preguntas de comprensión global.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	avanzado	activo	9	12	\N	\N	f	\N
307	CG-2-4-INH-B-01	Detener una acción en curso ante la señal 'para'	Cognición	Cognición	Control inhibitorio	3-5	El paciente detendrá su acción motora en curso (correr, aplaudir, hablar) inmediatamente al escuchar la señal 'para' del terapeuta, en el 80 % de los ensayos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
308	CG-2-4-INH-B-02	Esperar su turno antes de tomar un objeto o iniciar una actividad	Cognición	Cognición	Control inhibitorio	3-5	El paciente esperará al menos 10 segundos antes de tomar su turno en actividades de espera, sin protestar ni intentar saltearse el turno, en el 75 % de los ensayos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
309	CG-4-6-INH-B-01	Inhibir respuesta prepotente ante señales visuales cambiantes	Cognición	Cognición	Control inhibitorio	3-5	En juegos de Simón dice, el paciente responderá solo cuando el terapeuta diga 'Simón dice', inhibiendo la acción cuando no se incluya la consigna, con menos del 20 % de errores.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
310	CG-4-6-INH-B-02	Controlar la impulsividad verbal: pensar antes de responder	Cognición	Cognición	Control inhibitorio	3-5	El paciente esperará a que el terapeuta termine la pregunta antes de responder, evitando respuestas impulsivas incompletas, en el 80 % de las oportunidades de respuesta.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.331988	cognición	básico	activo	3	5	\N	\N	f	\N
311	CG-4-6-INH-M-01	Inhibir respuesta habitual en tareas de interferencia (tipo Stroop)	Cognición	Cognición	Control inhibitorio	3-5	En tareas de interferencia visual-verbal (nombrar el color de la tinta ignorando el significado de la palabra), el paciente completará con menos del 25 % de errores en 30 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	3	5	\N	\N	f	\N
312	CG-4-6-INH-M-02	Resistir la distracción de estímulos irrelevantes durante una tarea	Cognición	Cognición	Control inhibitorio	3-5	El paciente completará tareas de 10 minutos en presencia de distractores auditivos y visuales moderados, manteniendo la precisión de ejecución por encima del 80 %.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	3	5	\N	\N	f	\N
313	CG-6-8-INH-M-01	Inhibir respuestas verbales inapropiadas en situaciones sociales	Cognición	Cognición	Control inhibitorio	6-8	El paciente aplicará la regla 'pausa y pienso' antes de hacer comentarios en situaciones sociales de role-play, evitando comentarios impulsivos inapropiados en el 75 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	6	8	\N	\N	f	\N
314	CG-6-8-INH-M-02	Mantener el control inhibitorio bajo presión de tiempo	Cognición	Cognición	Control inhibitorio	6-8	El paciente mantendrá un nivel de errores de inhibición por debajo del 20 % en tareas go/no-go con presión de tiempo (respuesta requerida en menos de 1 segundo).	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	6	8	\N	\N	f	\N
315	CG-6-8-INH-A-01	Aplicar estrategias de autocontrol ante la frustración	Cognición	Cognición	Control inhibitorio	6-8	El paciente aplicará al menos una estrategia de regulación (respiración, contar hasta 10, alejarse) antes de reaccionar impulsivamente ante tareas frustrantes, observable en el 75 % de las situaciones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	6	8	\N	\N	f	\N
316	CG-8-10-INH-A-01	Suprimir respuestas automáticas para adoptar estrategias deliberadas	Cognición	Cognición	Control inhibitorio	9-12	El paciente abandonará la estrategia automática e implementará una estrategia deliberada más eficiente cuando la primera falle, haciendo el cambio en el 75 % de los intentos relevantes.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	9	12	\N	\N	f	\N
317	CG-8-10-INH-A-02	Inhibir la interferencia de información irrelevante en razonamiento complejo	Cognición	Cognición	Control inhibitorio	9-12	El paciente resolverá problemas con información irrelevante incluida (trampas), ignorando los datos no pertinentes y centrándose solo en la información relevante con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	9	12	\N	\N	f	\N
318	CG-4-6-FLX-B-01	Cambiar de criterio de clasificación ante una nueva consigna	Cognición	Cognición	Flexibilidad cognitiva	3-5	El paciente cambiará el criterio de clasificación de tarjetas (de color a forma, de forma a tamaño) cuando el terapeuta lo indique, sin cometer errores de perseveración en el 75 % de los ensayos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	básico	activo	3	5	\N	\N	f	\N
319	CG-4-6-FLX-B-02	Adaptarse a cambios de regla en juegos estructurados	Cognición	Cognición	Flexibilidad cognitiva	3-5	El paciente ajustará su comportamiento cuando las reglas de un juego cambien de forma inesperada, aplicando la nueva regla correctamente en el 80 % de los turnos siguientes al cambio.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	básico	activo	3	5	\N	\N	f	\N
320	CG-4-6-FLX-M-01	Generar múltiples soluciones para un mismo problema	Cognición	Cognición	Flexibilidad cognitiva	3-5	El paciente generará al menos 3 soluciones distintas para un problema cotidiano presentado por el terapeuta (¿qué harías si perdieras tu mochila?), con respuestas coherentes y variadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	3	5	\N	\N	f	\N
321	CG-6-8-FLX-M-01	Adoptar perspectivas alternativas ante una situación conflictiva	Cognición	Cognición	Flexibilidad cognitiva	6-8	El paciente identificará y verbalizará el punto de vista de al menos dos personas diferentes ante una situación social conflictiva presentada en viñetas, de forma coherente y sin rigidez.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	6	8	\N	\N	f	\N
322	CG-6-8-FLX-M-02	Cambiar de estrategia cuando la primera no es efectiva	Cognición	Cognición	Flexibilidad cognitiva	6-8	Al resolver problemas, el paciente abandonará una estrategia inefectiva y adoptará una alternativa distinta en el 75 % de los ensayos donde la primera estrategia produzca 2 errores consecutivos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	6	8	\N	\N	f	\N
323	CG-6-8-FLX-A-01	Integrar información contradictoria para alcanzar una conclusión flexible	Cognición	Cognición	Flexibilidad cognitiva	6-8	El paciente resolverá tareas con información contradictoria o ambigua, elaborando una conclusión flexible y justificada que reconozca la ambigüedad, en el 75 % de los escenarios planteados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	6	8	\N	\N	f	\N
324	CG-8-10-FLX-A-01	Aplicar pensamiento divergente para generar ideas originales	Cognición	Cognición	Flexibilidad cognitiva	9-12	El paciente generará al menos 8 usos distintos para un objeto cotidiano en 2 minutos (prueba de usos alternativos), con respuestas originales y categorías diversas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	9	12	\N	\N	f	\N
325	CG-8-10-FLX-A-02	Revisar y modificar el plan de acción ante feedback externo	Cognición	Cognición	Flexibilidad cognitiva	9-12	El paciente modificará su plan de acción de forma efectiva tras recibir retroalimentación correctiva, ajustando al menos 2 aspectos de la estrategia en el 75 % de las sesiones de resolución de problemas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	9	12	\N	\N	f	\N
326	CG-4-6-PSV-B-01	Identificar el problema en situaciones cotidianas simples	Cognición	Cognición	Resolución de problemas	3-5	El paciente identificará correctamente cuál es el problema en situaciones cotidianas presentadas en imágenes o viñetas (el niño no puede abrir el frasco, la pelota está en el techo) en el 80 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	básico	activo	3	5	\N	\N	f	\N
327	CG-4-6-PSV-B-02	Seleccionar la mejor solución entre opciones dadas	Cognición	Cognición	Resolución de problemas	3-5	El paciente seleccionará la solución más apropiada entre 3 opciones presentadas para problemas cotidianos simples, justificando su elección con al menos una razón en el 80 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	básico	activo	3	5	\N	\N	f	\N
328	CG-4-6-PSV-M-01	Planificar una secuencia de pasos para resolver un problema concreto	Cognición	Cognición	Resolución de problemas	3-5	El paciente planificará y verbalizará una secuencia de al menos 3 pasos para resolver un problema concreto (completar un rompecabezas, construir una torre específica) antes de ejecutarla.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	3	5	\N	\N	f	\N
329	CG-6-8-PSV-M-01	Aplicar el ciclo completo de resolución de problemas: identificar, planificar, ejecutar y evaluar	Cognición	Cognición	Resolución de problemas	6-8	El paciente utilizará el ciclo completo (1-identificar el problema, 2-generar soluciones, 3-elegir y ejecutar, 4-evaluar el resultado) en al menos el 70 % de las situaciones problema presentadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	6	8	\N	\N	f	\N
330	CG-6-8-PSV-M-02	Resolver problemas de razonamiento lógico deductivo	Cognición	Cognición	Resolución de problemas	6-8	El paciente resolverá acertijos y problemas de razonamiento deductivo (tipo pistas para descubrir quién es) explicando su razonamiento paso a paso con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	6	8	\N	\N	f	\N
331	CG-6-8-PSV-A-01	Generar y evaluar múltiples soluciones en problemas abiertos	Cognición	Cognición	Resolución de problemas	6-8	El paciente generará al menos 4 posibles soluciones para un problema abierto, evaluará pros y contras de cada una, y seleccionará la más adecuada justificando su decisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	6	8	\N	\N	f	\N
332	CG-6-8-PSV-A-02	Resolver problemas con información parcial o ambigua	Cognición	Cognición	Resolución de problemas	6-8	El paciente resolverá problemas presentados con información incompleta, identificando qué información falta, haciendo suposiciones razonables y llegando a una solución justificada.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	6	8	\N	\N	f	\N
333	CG-8-10-PSV-A-01	Transferir estrategias de resolución a problemas de dominio nuevo	Cognición	Cognición	Resolución de problemas	9-12	El paciente aplicará estrategias aprendidas en un tipo de problema (laberintos, rompecabezas) a un problema de dominio nuevo que requiera la misma estrategia, sin instrucción explícita.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	9	12	\N	\N	f	\N
334	CG-8-10-PSV-A-02	Evaluar la efectividad de soluciones y aprender del error	Cognición	Cognición	Resolución de problemas	9-12	El paciente evaluará el resultado de sus soluciones, identificará por qué fallaron las inefectivas y ajustará su estrategia en el intento siguiente en el 75 % de las situaciones de error.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	avanzado	activo	9	12	\N	\N	f	\N
335	CG-8-10-AT-M-01	Mantener la atención en tareas académicas durante 20-25 minutos	Cognición	Cognición	Atención sostenida	9-12	El paciente completará tareas académicas durante 20-25 minutos continuos con menos de 3 interrupciones por distracción observadas por el terapeuta, en 3 sesiones consecutivas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.339835	cognición	intermedio	activo	9	12	\N	\N	f	\N
336	CG-8-10-AT-M-02	Distribuir y alternar la atención entre dos tareas académicas	Cognición	Cognición	Atención alternante	9-12	El paciente alternará la atención entre dos tareas distintas (lectura y tomar notas) de forma fluida y sin perder el hilo de ninguna, con un desempeño mayor al 80 % en ambas tareas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	intermedio	activo	9	12	\N	\N	f	\N
337	CG-8-10-AT-A-01	Detectar y gestionar proactivamente los propios distractores	Cognición	Cognición	Metacognición atencional	9-12	El paciente identificará sus propios patrones de distracción y aplicará al menos 2 estrategias de autogestión (eliminar distractor, técnica de tiempo, recordatorio de tarea) en situaciones académicas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	avanzado	activo	9	12	\N	\N	f	\N
338	CG-8-10-RAZ-M-01	Identificar relaciones de analogía entre conceptos abstractos	Cognición	Cognición	Razonamiento abstracto	9-12	El paciente completará analogías verbales de dificultad creciente (cuchillo es a cortar como pincel es a ___) con un 80 % de aciertos en un set de 20 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	intermedio	activo	9	12	\N	\N	f	\N
339	CG-8-10-RAZ-M-02	Identificar la regla oculta en series numéricas y de figuras	Cognición	Cognición	Razonamiento inductivo	9-12	El paciente identificará la regla que gobierna series numéricas y de figuras de complejidad media y completará el siguiente elemento con un 80 % de precisión en 15 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	intermedio	activo	9	12	\N	\N	f	\N
340	CG-8-10-RAZ-A-01	Construir argumentos lógicos válidos con premisas y conclusión	Cognición	Cognición	Razonamiento lógico	9-12	El paciente construirá argumentos de la forma 'si... entonces...' con premisas válidas y conclusión lógica, y detectará falacias en argumentos presentados por el terapeuta en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	avanzado	activo	9	12	\N	\N	f	\N
341	CG-8-10-RAZ-A-02	Aplicar razonamiento hipotético-deductivo en situaciones complejas	Cognición	Cognición	Razonamiento hipotético	9-12	El paciente formulará y evaluará hipótesis ante problemas abiertos, descartando hipótesis inválidas con evidencia y llegando a la hipótesis más probable de forma sistemática.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	avanzado	activo	9	12	\N	\N	f	\N
342	CG-8-10-MEM-A-01	Organizar información en categorías para mejorar la retención	Cognición	Cognición	Memoria episódica	9-12	El paciente organizará espontáneamente la información a memorizar en categorías o esquemas antes del aprendizaje, logrando al menos un 20 % de mejora en retención respecto a la condición sin organización.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	avanzado	activo	9	12	\N	\N	f	\N
343	CG-8-10-MEM-A-02	Usar técnicas mnemónicas avanzadas para material académico	Cognición	Cognición	Estrategias de memoria	9-12	El paciente aplicará al menos 2 técnicas mnemónicas (método loci, acrónimos, historias mnemónicas) para memorizar listas de 10-12 ítems con un 80 % de retención tras 10 minutos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	cognición	avanzado	activo	9	12	\N	\N	f	\N
344	EF-3-5-PLN-B-01	Anticipar el material necesario para una actividad sencilla	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	3-5	El paciente identificará y reunirá el material necesario antes de iniciar una actividad simple (colorear: traer lápices y papel), sin necesidad de que el terapeuta lo recuerde, en el 75 % de las sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
345	EF-3-5-PLN-B-02	Describir qué hará antes de empezar una tarea en juego de roles	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	3-5	En situaciones de juego de roles (jugar a la cocina, construir con bloques), el paciente verbalizará qué hará primero con al menos 2 pasos antes de comenzar la actividad en el 75 % de los intentos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
346	EF-3-5-PLN-B-03	Ordenar imágenes de pasos de una tarea cotidiana en secuencia correcta	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	3-5	El paciente ordenará 4 imágenes que muestran los pasos de una tarea cotidiana (lavarse los dientes, preparar el desayuno) en la secuencia lógica correcta con un 80 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
347	EF-5-7-PLN-B-01	Establecer un plan de 3 pasos para completar un proyecto simple	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	6-8	El paciente establecerá y verbalizará un plan de al menos 3 pasos para completar una tarea asignada (hacer una tarjeta, construir un modelo), ejecutándolos en orden con mínima ayuda.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
348	EF-5-7-PLN-B-02	Identificar posibles obstáculos en un plan y proponer soluciones	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	6-8	Dado un plan simple, el paciente identificará al menos un posible problema (¿qué pasa si no tenemos tijeras?) y propondrá una solución alternativa en el 75 % de los escenarios presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
349	EF-5-7-PLN-M-01	Planificar una actividad de varios días con tareas asignadas	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	6-8	El paciente planificará un proyecto de 3-4 días (preparar una presentación, hacer un álbum) distribuyendo las tareas en el tiempo con al menos 2 pasos por día, de forma coherente.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
350	EF-5-7-PLN-M-02	Usar soporte visual (lista, diagrama) para guiar la ejecución de un plan	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	6-8	El paciente elaborará y usará una lista de tareas o diagrama de flujo para guiar la ejecución de un proyecto, marcando los pasos completados y ajustando el plan si es necesario.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
351	EF-7-10-PLN-M-01	Planificar el estudio semanal distribuyendo tareas por prioridad	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	El paciente organizará sus tareas escolares de la semana en un horario, asignando tiempo según la urgencia e importancia de cada tarea, y lo cumplirá en al menos el 70 % de los días.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
352	EF-7-10-PLN-M-02	Anticipar consecuencias de sus decisiones en la planificación	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	El paciente anticipará verbalmente las consecuencias a corto y mediano plazo de sus decisiones en situaciones de planificación hipotética con un 75 % de coherencia lógica.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
353	EF-7-10-PLN-A-01	Elaborar un plan de proyecto con recursos, tiempos y metas medibles	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	El paciente elaborará un plan de proyecto escolar especificando recursos necesarios, pasos ordenados, tiempos estimados y criterios de éxito, completándolo en los tiempos planificados con un 70 % de cumplimiento.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
354	EF-7-10-PLN-A-02	Revisar y ajustar el plan en marcha ante imprevistos	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	Ante un imprevisto introducido por el terapeuta durante la ejecución de un proyecto, el paciente revisará y ajustará su plan de forma flexible y coherente en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
355	EF-7-10-PLN-A-03	Planificar metas a largo plazo desglosándolas en pasos semanales	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	El paciente identificará una meta a largo plazo personal o académica y la desglosará en sub-metas semanales realizables con criterios de verificación observables.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
356	EF-9-12-PLN-A-01	Diseñar un plan de estudio integral para un período de exámenes	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	El paciente diseñará un plan de estudio para un período de evaluaciones, distribuyendo el tiempo de revisión por materia según dificultad e importancia, y lo cumplirá en al menos el 70 % de las sesiones planificadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
357	EF-9-12-PLN-A-02	Planificar y ejecutar un proyecto de investigación en etapas	Funciones Ejecutivas	Funciones Ejecutivas	Planificación	9-12	El paciente planificará un proyecto de investigación en 4 etapas (búsqueda de información, síntesis, elaboración, presentación) con fechas límite y entregará cada etapa en tiempo y forma.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
358	EF-3-5-ORG-B-01	Ordenar el material de trabajo al terminar cada actividad	Funciones Ejecutivas	Funciones Ejecutivas	Organización	3-5	El paciente ordenará y devolverá el material al lugar correspondiente al finalizar cada actividad sin que el terapeuta lo recuerde, en el 80 % de las sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
359	EF-3-5-ORG-B-02	Seguir la secuencia de una rutina de hasta 4 pasos	Funciones Ejecutivas	Funciones Ejecutivas	Organización	3-5	El paciente seguirá la rutina de inicio de sesión (saludar, sacar material, elegir actividad, sentarse) de 4 pasos en el orden correcto con apoyo visual en el 80 % de las sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
360	EF-5-7-ORG-B-01	Clasificar y archivar material por categorías o temas	Funciones Ejecutivas	Funciones Ejecutivas	Organización	6-8	El paciente organizará materiales de trabajo (hojas de actividades, tarjetas) en carpetas o categorías correctas con un 80 % de precisión, usando etiquetas visuales como apoyo.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.348892	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
361	EF-5-7-ORG-B-02	Preparar la mochila escolar según el horario del día siguiente	Funciones Ejecutivas	Funciones Ejecutivas	Organización	6-8	El paciente preparará su mochila según el horario del día siguiente de forma autónoma, con menos de 1 olvido por semana según reporte del familiar durante 3 semanas consecutivas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
362	EF-5-7-ORG-M-01	Mantener organizado un espacio de trabajo durante una actividad extensa	Funciones Ejecutivas	Funciones Ejecutivas	Organización	6-8	El paciente mantendrá su espacio de trabajo organizado durante actividades de 20 minutos, guardando el material que no usa y manteniendo visible solo el relevante, en el 75 % de las sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
363	EF-5-7-ORG-M-02	Usar agendas o listas de verificación para tareas escolares	Funciones Ejecutivas	Funciones Ejecutivas	Organización	6-8	El paciente usará una agenda o lista de tareas diaria para registrar las actividades escolares y las irá marcando al completarlas, con al menos el 80 % de las tareas registradas correctamente.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
364	EF-7-10-ORG-M-01	Organizar la información de un texto en esquemas o mapas conceptuales	Funciones Ejecutivas	Funciones Ejecutivas	Organización	9-12	El paciente elaborará un mapa conceptual o esquema que organice la información clave de un texto leído, con categorías, subcategorías y relaciones correctas en el 75 % de los textos asignados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
365	EF-7-10-ORG-M-02	Gestionar el tiempo en una sesión de trabajo autónomo	Funciones Ejecutivas	Funciones Ejecutivas	Organización	9-12	El paciente dividirá una sesión de trabajo de 30 minutos en bloques para diferentes tareas, monitoreará el tiempo con un reloj y respetará los tiempos asignados en el 75 % de los bloques.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
366	EF-7-10-ORG-A-01	Crear sistemas de organización personal para materiales y agenda	Funciones Ejecutivas	Funciones Ejecutivas	Organización	9-12	El paciente diseñará e implementará un sistema personal de organización (color por materia, secciones de agenda, carpetas digitales o físicas) y lo mantendrá actualizado durante 4 semanas consecutivas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
367	EF-7-10-ORG-A-02	Priorizar tareas según urgencia e importancia de forma autónoma	Funciones Ejecutivas	Funciones Ejecutivas	Organización	9-12	El paciente clasificará sus tareas en una matriz urgente/importante de forma autónoma y comenzará siempre por las tareas urgentes e importantes, demostrando una selección adecuada en el 80 % de los días.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
368	EF-9-12-ORG-A-01	Gestionar autónomamente la agenda escolar y extracurricular	Funciones Ejecutivas	Funciones Ejecutivas	Organización	9-12	El paciente gestionará de forma autónoma su agenda semanal (escolar + actividades extracurriculares) registrando compromisos, anticipando conflictos y reorganizando sin supervisión del adulto.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
369	EF-9-12-ORG-A-02	Usar herramientas digitales para organizar proyectos académicos	Funciones Ejecutivas	Funciones Ejecutivas	Organización	9-12	El paciente usará herramientas digitales (calendario, lista de tareas, notas) para organizar proyectos académicos, actualizando el sistema regularmente y sin olvidos reportados en el 80 % de las semanas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
370	EF-3-5-SRG-B-01	Reconocer y nombrar sus propias emociones básicas	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	3-5	El paciente identificará y nombrará su emoción predominante (feliz, triste, enojado, asustado) ante situaciones presentadas en imágenes o vividas en sesión con un 80 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
371	EF-3-5-SRG-B-02	Pedir ayuda al adulto cuando se siente frustrado	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	3-5	El paciente usará palabras para solicitar ayuda (ayúdame, no puedo) en lugar de conductas disruptivas cuando se enfrente a tareas frustrantes, en el 75 % de las situaciones observadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
372	EF-5-7-SRG-B-01	Aplicar estrategias de calma ante el enojo o la frustración	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	6-8	El paciente aplicará al menos una estrategia de calma (respiración, contar, alejarse) cuando detecte que su nivel de enojo sube, reduciendo la conducta disruptiva al 80 % en comparación con la línea base.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
373	EF-5-7-SRG-B-02	Tolerar la demora de gratificación en actividades de espera	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	6-8	El paciente esperará hasta 5 minutos para recibir una recompensa preferida sin realizar conductas de protesta (queja intensa, llanto, abandono de tarea) en el 80 % de los ensayos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
374	EF-5-7-SRG-M-01	Monitorear y ajustar el nivel de activación durante las tareas	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	6-8	El paciente usará un termómetro de activación para autoevaluar su nivel de alerta e implementará estrategias de regulación (actividad física corta, respiración) para mantenerse en zona óptima de aprendizaje.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
375	EF-5-7-SRG-M-02	Expresar necesidades y emociones con palabras en situaciones difíciles	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	6-8	El paciente expresará verbalmente cómo se siente y qué necesita en situaciones emocionalmente difíciles, sin recurrir a conductas disruptivas, en el 75 % de los episodios de malestar observados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
376	EF-7-10-SRG-M-01	Aplicar el ciclo de autorregulación emocional: detectar, nombrar, regular	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	9-12	Ante situaciones de alta carga emocional, el paciente detectará su emoción, la nombrará con precisión y aplicará al menos una estrategia de regulación aprendida antes de responder, en el 75 % de los episodios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
377	EF-7-10-SRG-M-02	Usar el diálogo interno positivo para manejar el estrés	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	9-12	El paciente sustituirá pensamientos negativos automáticos (no puedo, soy tonto) por afirmaciones de diálogo interno adaptativo (puedo intentarlo, me equivoco pero aprendo) en el 70 % de los episodios identificados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
378	EF-7-10-SRG-A-01	Usar estrategias de regulación cognitiva ante la ansiedad por evaluación	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	9-12	El paciente aplicará estrategias cognitivas (reestructuración de pensamientos catastróficos, técnica del peor/mejor/más probable caso) antes de situaciones de evaluación, reportando reducción de ansiedad.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
379	EF-7-10-SRG-A-02	Aplicar habilidades de autorregulación en contextos sociales de conflicto	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	9-12	En situaciones de conflicto con pares o adultos, el paciente aplicará el protocolo PARA (Pausa, Analiza, Responde, Ajusta) de forma autónoma en el 70 % de los conflictos reportados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
380	EF-9-12-SRG-A-01	Desarrollar un plan personal de gestión del estrés académico	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	9-12	El paciente elaborará e implementará un plan personal de gestión del estrés con al menos 3 estrategias (ejercicio, pausas, técnicas de respiración) y reportará su efectividad semanalmente.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
381	EF-9-12-SRG-A-02	Generalizar la autorregulación emocional a contextos cotidianos sin apoyo clínico	Funciones Ejecutivas	Funciones Ejecutivas	Autorregulación	9-12	El familiar y el paciente reportarán uso autónomo de estrategias de regulación en al menos 3 contextos distintos (colegio, hogar, actividades extracurriculares) sin señalización del adulto, durante 4 semanas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
382	EF-3-5-IMP-B-01	Respetar normas de turnos en actividades grupales de 2 participantes	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	3-5	El paciente esperará su turno y respetará el del compañero en juegos de 2 participantes, sin interrumpir o intentar saltearse el turno, en el 80 % de los intercambios de la sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	3	5	\N	\N	f	\N
384	EF-5-7-IMP-B-01	Pedir permiso antes de tomar objetos de otros	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	6-8	El paciente pedirá permiso verbalmente antes de tomar objetos pertenecientes a otros (compañeros, terapeuta) en el 85 % de las situaciones observadas, sin necesidad de recordatorio.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
385	EF-5-7-IMP-B-02	Levantar la mano antes de hablar en situaciones grupales	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	6-8	El paciente levantará la mano y esperará que se le dé la palabra antes de hablar en situaciones grupales o de conversación con el terapeuta, en el 80 % de las oportunidades.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.355461	funciones ejecutivas	básico	activo	6	8	\N	\N	f	\N
386	EF-5-7-IMP-M-01	Aplicar la pausa cognitiva antes de actuar ante provocaciones	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	6-8	En situaciones de provocación simuladas en role-play, el paciente aplicará la estrategia 'para y piensa' antes de responder, eligiendo una respuesta asertiva en lugar de agresiva en el 75 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
387	EF-5-7-IMP-M-02	Resistir la impulsividad en tareas de elección diferida	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	6-8	El paciente elegirá esperar 5 minutos para obtener 2 recompensas en lugar de tomar 1 recompensa inmediatamente, en el 70 % de los ensayos de tarea de gratificación diferida.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	intermedio	activo	6	8	\N	\N	f	\N
388	EF-7-10-IMP-M-01	Regular la velocidad de respuesta académica para reducir errores por impulsividad	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	9-12	El paciente leerá el enunciado completo antes de responder y revisará su respuesta antes de entregarla, reduciendo los errores impulsivos en tareas académicas al menos un 30 % respecto a la línea base.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
389	EF-7-10-IMP-M-02	Controlar impulsos verbales en conversaciones emocionalmente intensas	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	9-12	El paciente evitará interrumpir, gritar o decir comentarios hirientes durante conversaciones de alta carga emocional en role-play, usando en cambio respuestas asertivas en el 75 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	intermedio	activo	9	12	\N	\N	f	\N
390	EF-7-10-IMP-A-01	Generalizar el control de impulsos a contextos sociales sin supervisión	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	9-12	El familiar reportará mejora sostenida en el control de impulsos del paciente en contextos sin supervisión del terapeuta (recreo, casa) con menos de 2 episodios de conducta impulsiva relevante por semana.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
391	EF-7-10-IMP-A-02	Usar la autoevaluación diferida para aprender de reacciones impulsivas	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	9-12	Tras un episodio de reacción impulsiva, el paciente completará un registro de autoevaluación identificando el disparador, la reacción y la alternativa posible, en el 80 % de los episodios reportados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
392	EF-9-12-IMP-A-01	Tomar decisiones reflexivas evaluando consecuencias a largo plazo	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	9-12	Ante decisiones importantes simuladas (situaciones de presión de pares, dilemas éticos), el paciente considerará consecuencias a corto y largo plazo antes de decidir, tomando una decisión reflexiva en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
393	EF-9-12-IMP-A-02	Aplicar técnicas de control de impulsos en entornos de alta exigencia social	Funciones Ejecutivas	Funciones Ejecutivas	Control de impulsos	9-12	El paciente aplicará estrategias de control de impulsos (pausa, respiración, salida de la situación) de forma autónoma en entornos de alta demanda social, con reporte de efectividad en el 70 % de los episodios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	funciones ejecutivas	avanzado	activo	9	12	\N	\N	f	\N
394	SC-2-4-TUR-B-01	Participar en juegos de turnos simples con el adulto	Comunicación Social	Comunicación Social	Turnos conversacionales	3-5	El paciente participará en juegos de turnos alternados (dar y tomar objetos, rodar una pelota) respetando la alternancia por al menos 5 intercambios consecutivos sin apropiarse del turno del adulto.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	básico	activo	3	5	\N	\N	f	\N
395	SC-2-4-TUR-B-02	Esperar que el adulto termine de hablar antes de vocalizar	Comunicación Social	Comunicación Social	Turnos conversacionales	3-5	El paciente esperará que el adulto termine su enunciado antes de vocalizar o señalar, en el 75 % de los intercambios de protoconversación observados durante la sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	básico	activo	3	5	\N	\N	f	\N
396	SC-4-6-TUR-B-01	Tomar y ceder el turno usando señales no verbales apropiadas	Comunicación Social	Comunicación Social	Turnos conversacionales	3-5	El paciente usará mirada, pausa y gesto de mano para tomar y ceder el turno conversacional de forma apropiada en el 80 % de los intercambios comunicativos observados en sesión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	básico	activo	3	5	\N	\N	f	\N
397	SC-4-6-TUR-B-02	Respetar los turnos en juegos de mesa grupales de 3-4 participantes	Comunicación Social	Comunicación Social	Turnos conversacionales	3-5	El paciente esperará su turno en juegos de mesa de 3-4 participantes sin protestar, sin saltearse el turno y sin distraerse durante el turno de los demás, en el 80 % de las rondas jugadas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	básico	activo	3	5	\N	\N	f	\N
398	SC-4-6-TUR-M-01	Usar marcadores verbales para tomar el turno de forma apropiada	Comunicación Social	Comunicación Social	Turnos conversacionales	3-5	El paciente usará marcadores verbales (yo quiero decir, a mí me parece, ¿puedo agregar algo?) para tomar el turno conversacional de forma no interrumpiente en el 75 % de los intercambios grupales.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	3	5	\N	\N	f	\N
399	SC-4-6-TUR-M-02	Reconocer cuándo el interlocutor ha terminado su turno para tomar el propio	Comunicación Social	Comunicación Social	Turnos conversacionales	3-5	El paciente identificará señales de fin de turno (descenso de tono, mirada al interlocutor, pausa) y tomará su turno solo después de detectarlas, en el 80 % de los intercambios conversacionales.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	3	5	\N	\N	f	\N
400	SC-6-8-TUR-M-01	Mantener conversaciones balanceadas sin monopolizar el turno	Comunicación Social	Comunicación Social	Turnos conversacionales	6-8	En conversaciones de 5 minutos, el paciente cederá el turno al menos 4 veces sin que el interlocutor deba pedírselo, evitando monopolizar por más de 3 turnos consecutivos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
401	SC-6-8-TUR-M-02	Hacer preguntas para mantener el turno del interlocutor activo	Comunicación Social	Comunicación Social	Turnos conversacionales	6-8	El paciente formulará al menos 2 preguntas relacionadas con lo que el interlocutor dijo durante una conversación de 5 minutos, manteniendo el flujo del intercambio.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
402	SC-6-8-TUR-A-01	Coordinar turnos en conversaciones grupales de 4-5 participantes	Comunicación Social	Comunicación Social	Turnos conversacionales	6-8	En conversaciones grupales de 4-5 personas, el paciente tomará, cederá y manejará interrupciones de forma apropiada, contribuyendo de forma equilibrada y sin dominar ni retirarse, en el 75 % de los intercambios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	avanzado	activo	6	8	\N	\N	f	\N
403	SC-8-10-TUR-A-01	Gestionar el turno en debates y discusiones académicas	Comunicación Social	Comunicación Social	Turnos conversacionales	9-12	En debates y discusiones académicas, el paciente gestionará el turno de forma estratégica (apoyo del punto anterior, contraargumento, síntesis) respetando el orden establecido en el 80 % de los intercambios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
404	SC-4-6-CON-B-01	Iniciar conversaciones con saludos y preguntas de apertura	Comunicación Social	Comunicación Social	Habilidades conversacionales	3-5	El paciente iniciará una conversación con el terapeuta o un par usando un saludo y al menos una pregunta de apertura apropiada al contexto (¿a qué jugamos?, ¿cómo te fue?) en el 80 % de las sesiones.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	básico	activo	3	5	\N	\N	f	\N
405	SC-4-6-CON-B-02	Responder preguntas sobre sí mismo de forma apropiada y completa	Comunicación Social	Comunicación Social	Habilidades conversacionales	3-5	El paciente responderá preguntas sobre su vida (nombre, edad, familia, gustos, colegio) con oraciones completas y apropiadas, sin limitarse a monosílabos, en el 80 % de los intercambios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	básico	activo	3	5	\N	\N	f	\N
406	SC-4-6-CON-M-01	Mantener un tópico conversacional relevante por al menos 4 turnos	Comunicación Social	Comunicación Social	Habilidades conversacionales	3-5	El paciente mantendrá un tópico conversacional (elegido por el terapeuta o por él) por al menos 4 turnos sin desviarse hacia temas no relacionados, en el 75 % de los intercambios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	3	5	\N	\N	f	\N
407	SC-4-6-CON-M-02	Cerrar conversaciones de forma apropiada con despedidas explícitas	Comunicación Social	Comunicación Social	Habilidades conversacionales	3-5	El paciente cerrará conversaciones y actividades con despedidas verbales apropiadas (hasta luego, nos vemos, fue divertido) de forma espontánea en el 80 % de las finalizaciones de sesión o actividad.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	3	5	\N	\N	f	\N
408	SC-6-8-CON-M-01	Hacer preguntas relevantes para mostrar interés en el interlocutor	Comunicación Social	Comunicación Social	Habilidades conversacionales	6-8	El paciente formulará al menos 3 preguntas relacionadas con el tema del interlocutor en una conversación de 5 minutos, demostrando interés genuino y conexión con lo dicho.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
409	SC-6-8-CON-M-02	Introducir cambios de tópico de forma suave y explícita	Comunicación Social	Comunicación Social	Habilidades conversacionales	6-8	El paciente marcará los cambios de tópico conversacional con frases de transición (cambiando de tema, hablando de otra cosa) en el 80 % de las ocasiones en que cambie el tópico.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
410	SC-6-8-CON-A-01	Sostener conversaciones sobre temas abstractos o hipotéticos	Comunicación Social	Comunicación Social	Habilidades conversacionales	6-8	El paciente participará en conversaciones sobre temas abstractos o hipotéticos (¿qué harías si pudieras volar?, temas de ciencia o ética simple) con contribuciones coherentes y elaboradas por al menos 6 turnos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.361966	comunicación social	avanzado	activo	6	8	\N	\N	f	\N
411	SC-6-8-CON-A-02	Negociar y llegar a acuerdos en conversaciones de resolución de conflictos	Comunicación Social	Comunicación Social	Habilidades conversacionales	6-8	En situaciones de conflicto simuladas, el paciente negociará usando habilidades de escucha activa, propuesta de compromisos y llegará a un acuerdo verbal con el interlocutor en el 70 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	6	8	\N	\N	f	\N
412	SC-8-10-CON-A-01	Participar en conversaciones de profundidad epistémica	Comunicación Social	Comunicación Social	Habilidades conversacionales	9-12	El paciente participará en conversaciones sobre temas complejos (dilemas éticos, temas científicos) aportando perspectivas razonadas, reconociendo la opinión del otro y construyendo sobre las ideas previas.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
413	SC-8-10-CON-A-02	Usar retroalimentación no verbal para sostener la conversación	Comunicación Social	Comunicación Social	Habilidades conversacionales	9-12	El paciente usará señales de escucha activa (asentir, contacto visual, comentarios de seguimiento: ajá, entiendo, ¿en serio?) de forma consistente y natural en conversaciones de 5-10 minutos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
415	SC-2-4-EMO-B-02	Asociar situaciones cotidianas con emociones básicas	Comunicación Social	Comunicación Social	Reconocimiento emocional	3-5	El paciente asociará situaciones representadas en imágenes con la emoción apropiada (cumpleaños → feliz, caída → llanto) con un 80 % de aciertos en 15 ítems.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	básico	activo	3	5	\N	\N	f	\N
416	SC-4-6-EMO-B-01	Nombrar la emoción que sentiría en situaciones hipotéticas	Comunicación Social	Comunicación Social	Reconocimiento emocional	3-5	El paciente nombrará la emoción que él sentiría en situaciones hipotéticas (¿cómo te sentirías si perdieras tu juguete favorito?) con una respuesta emocionalmente coherente en el 80 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	básico	activo	3	5	\N	\N	f	\N
417	SC-4-6-EMO-B-02	Reconocer señales corporales de las propias emociones	Comunicación Social	Comunicación Social	Reconocimiento emocional	3-5	El paciente identificará al menos 2 señales corporales asociadas a cada una de 4 emociones básicas (corazón acelerado-miedo, músculos tensos-enojo) con un 75 % de precisión.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	básico	activo	3	5	\N	\N	f	\N
418	SC-4-6-EMO-M-01	Reconocer emociones complejas: vergüenza, orgullo, celos, sorpresa	Comunicación Social	Comunicación Social	Reconocimiento emocional	3-5	El paciente identificará y nombrará correctamente 4 emociones complejas (vergüenza, orgullo, celos, sorpresa) en expresiones faciales, situaciones y descripciones verbales con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	intermedio	activo	3	5	\N	\N	f	\N
419	SC-4-6-EMO-M-02	Inferir la emoción de un personaje a partir del contexto de una historia	Comunicación Social	Comunicación Social	Reconocimiento emocional	3-5	Tras escuchar una historia breve, el paciente inferirá la emoción del personaje sin que se mencione explícitamente, justificando su respuesta con al menos una referencia al contexto, en el 75 % de las historias.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	intermedio	activo	3	5	\N	\N	f	\N
424	SC-8-10-EMO-A-02	Usar el vocabulario emocional para describir estados internos propios y ajenos	Comunicación Social	Comunicación Social	Reconocimiento emocional	9-12	El paciente usará un vocabulario emocional preciso y matizado (decepción, gratitud, indignación, melancolía) para describir estados propios y ajenos en contextos clínicos y naturales.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
425	SC-4-6-INF-B-01	Inferir intenciones simples de personajes en cuentos	Comunicación Social	Comunicación Social	Inferencia social	3-5	El paciente inferirá la intención de un personaje en una historia simple (¿por qué crees que hizo eso?) con una explicación coherente con el contexto en el 75 % de los cuentos presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	básico	activo	3	5	\N	\N	f	\N
426	SC-4-6-INF-B-02	Comprender que los demás pueden tener creencias diferentes a las propias	Comunicación Social	Comunicación Social	Inferencia social	3-5	En tareas de falsa creencia de primer orden, el paciente predecirá correctamente lo que pensará un personaje que no tuvo acceso a nueva información, con un 75 % de aciertos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	básico	activo	3	5	\N	\N	f	\N
427	SC-6-8-INF-M-01	Inferir las intenciones ocultas de personajes en situaciones sociales complejas	Comunicación Social	Comunicación Social	Inferencia social	6-8	El paciente identificará la intención real detrás de acciones o palabras de un personaje cuya motivación no se explicita en la historia, con una explicación coherente en el 75 % de los escenarios.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
428	SC-6-8-INF-M-02	Interpretar el comportamiento social usando claves contextuales múltiples	Comunicación Social	Comunicación Social	Inferencia social	6-8	El paciente integrará claves verbales, no verbales y contextuales para interpretar situaciones sociales ambiguas en viñetas, produciendo una interpretación coherente con el 75 % de los contextos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	intermedio	activo	6	8	\N	\N	f	\N
429	SC-6-8-INF-A-01	Resolver tareas de falsa creencia de segundo orden	Comunicación Social	Comunicación Social	Inferencia social	6-8	El paciente resolverá tareas de falsa creencia de segundo orden (lo que A piensa que B piensa) con una predicción correcta y justificada en el 75 % de los escenarios presentados.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	6	8	\N	\N	f	\N
430	SC-6-8-INF-A-02	Detectar faux pas sociales y explicar por qué incomodan	Comunicación Social	Comunicación Social	Inferencia social	6-8	El paciente identificará meteduras de pata sociales en historias (alguien dice algo inapropiado sin darse cuenta) y explicará por qué resultaron ofensivas para el receptor en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	6	8	\N	\N	f	\N
431	SC-8-10-INF-A-01	Inferir la perspectiva y el estado mental de múltiples actores en un mismo escenario	Comunicación Social	Comunicación Social	Inferencia social	9-12	El paciente describirá el estado mental y perspectiva de 3 o más personajes en un mismo escenario social complejo, diferenciando correctamente sus motivaciones y creencias en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
432	SC-8-10-INF-A-02	Usar la teoría de la mente para predecir y explicar conducta social	Comunicación Social	Comunicación Social	Inferencia social	9-12	El paciente predecirá y explicará la conducta de personas en situaciones sociales nuevas usando razonamiento de teoría de la mente, con una predicción acertada y justificación coherente en el 75 % de los casos.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-16 19:03:36.367606	comunicación social	avanzado	activo	9	12	\N	\N	f	\N
\.


--
-- TOC entry 3565 (class 0 OID 32801)
-- Dependencies: 234
-- Data for Name: goal_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goal_progress (id, goal_id, nota, status_anterior, status_nuevo, registro_clinico_id, created_at, progress_pct, intentos, correctas) FROM stdin;
33	4	Sesión 2026-03-18: Logrado	en progreso	logrado	23	2026-03-18 19:07:47.451181	100	\N	\N
34	19	Sesión 2026-03-18: En progreso	en progreso	en progreso	24	2026-03-18 19:17:23.955735	65	\N	\N
35	23	Sesión 2026-03-18: Con ayuda	activo	en progreso	26	2026-03-18 19:24:29.003425	40	\N	\N
36	20	Sesión 2026-03-18: En progreso	activo	en progreso	27	2026-03-18 19:48:12.348567	65	10	3
37	26	Sesión 2026-03-18 (objetivo del día): En progreso	activo	en progreso	28	2026-03-18 19:53:21.581399	65	8	6
38	11	Sesión 2026-03-19: En progreso	activo	en progreso	29	2026-03-19 03:04:56.695154	65	5	2
39	27	Sesión 2026-03-19 (objetivo del día): En progreso	activo	en progreso	29	2026-03-19 03:04:57.20981	65	5	1
40	23	se cansa	en progreso	en progreso	30	2026-03-19 03:31:09.956647	40	5	3
41	28	n	activo	activo	30	2026-03-19 03:31:11.264829	15	6	3
42	2	le 	en progreso	en progreso	31	2026-03-24 18:02:28.035242	40	8	6
43	29	Sesión 2026-03-24 (objetivo del día): En progreso	activo	en progreso	31	2026-03-24 18:02:28.605444	65	5	2
44	26	Sesión 2026-03-28: En progreso	en progreso	en progreso	32	2026-03-28 21:22:33.411752	65	1	\N
45	30	Sesión 2026-03-28 (objetivo del día): En progreso	activo	en progreso	32	2026-03-28 21:22:33.468738	65	\N	\N
46	6	Sesión 2026-03-28: En progreso	en progreso	en progreso	33	2026-03-28 22:17:23.564285	65	14	8
47	31	Sesión 2026-03-28 (objetivo del día): En progreso	activo	en progreso	33	2026-03-28 22:17:24.200216	65	2	1
48	2	Sesión 2026-03-29: En progreso	en progreso	en progreso	34	2026-03-29 17:25:35.127366	65	20	5
49	14	Sesión 2026-03-29: En progreso	en progreso	en progreso	34	2026-03-29 17:25:35.131981	65	10	5
81	2	Sesión 2026-03-30: En progreso	en progreso	en progreso	67	2026-03-30 18:05:15.902307	65	\N	\N
82	14	Sesión 2026-03-30: En progreso	en progreso	en progreso	67	2026-03-30 18:05:15.94704	65	\N	\N
83	29	Sesión 2026-03-30: En progreso	en progreso	en progreso	67	2026-03-30 18:05:15.957847	65	\N	\N
84	29	Sesión 2026-04-03: En progreso	en progreso	en progreso	68	2026-04-03 18:14:23.700932	65	\N	\N
85	14	Sesión 2026-04-03: En progreso	en progreso	en progreso	68	2026-04-03 18:14:23.703851	65	\N	\N
86	2	Sesión 2026-04-03: En progreso	en progreso	en progreso	68	2026-04-03 18:14:23.704194	65	\N	\N
87	33	Sesión 2026-04-03 (objetivo del día): En progreso	activo	en progreso	68	2026-04-03 18:14:24.301826	65	\N	\N
88	31	Sesión 2026-04-03: Logrado	en progreso	logrado	69	2026-04-03 19:22:42.199416	100	5	5
89	6	Sesión 2026-04-03: En progreso	en progreso	en progreso	69	2026-04-03 19:22:42.216852	65	\N	\N
90	35	Sesión 2026-04-03 (objetivo del día): En progreso	activo	en progreso	69	2026-04-03 19:22:42.72946	65	1	\N
91	34	Sesión 2026-04-03 (objetivo del día): En progreso	activo	en progreso	69	2026-04-03 19:22:42.731784	65	1	\N
92	22	Sesión 2026-04-04: En progreso	activo	en progreso	70	2026-04-04 03:44:41.098036	65	5	4
93	36	Sesión 2026-04-04: Logrado	activo	logrado	70	2026-04-04 03:44:41.106208	100	2	2
94	11	Sesión 2026-04-09: En progreso	en progreso	en progreso	71	2026-04-09 01:50:40.083548	65	\N	\N
95	17	Sesión 2026-04-09: En progreso	activo	en progreso	71	2026-04-09 01:50:40.42847	65	\N	\N
96	27	Sesión 2026-04-09: En progreso	en progreso	en progreso	71	2026-04-09 01:50:40.760517	65	\N	\N
97	37	Sesión 2026-04-17 (objetivo del día): En progreso	activo	en progreso	72	2026-04-17 01:46:58.778901	65	\N	\N
98	38	Sesión 2026-04-17 (objetivo del día): En progreso	activo	en progreso	72	2026-04-17 01:46:58.805585	65	\N	\N
99	2	Sesión 2026-04-19: Consolidando	en progreso	en progreso	73	2026-04-19 23:15:58.878919	75	\N	\N
100	29	Sesión 2026-04-19: Nuevo	en progreso	activo	73	2026-04-19 23:15:58.891308	20	\N	\N
101	2	Sesión 2026-04-19: En proceso	en progreso	en progreso	74	2026-04-19 23:20:40.186834	50	\N	\N
2	2	Sesión 2026-03-30: En progreso	activo	en progreso	2	2026-03-30 21:20:20.219201	65	\N	\N
3	1	Sesión 2026-03-30: En progreso	activo	en progreso	2	2026-03-30 21:20:20.42823	65	2	1
4	2	Sesión 2026-03-30: En progreso	en progreso	en progreso	3	2026-03-30 21:34:34.868916	65	\N	\N
5	1	Sesión 2026-03-30: En progreso	en progreso	en progreso	3	2026-03-30 21:34:35.06712	65	\N	\N
7	4	Sesión 2026-03-31 (objetivo del día): En progreso	activo	en progreso	5	2026-03-31 00:35:42.530126	65	3	1
8	3	Sesión 2026-04-06: En progreso	en progreso	en progreso	6	2026-04-06 22:22:35.809883	65	\N	\N
9	5	Sesión 2026-04-06 (objetivo del día): En progreso	activo	en progreso	6	2026-04-06 22:22:36.560002	65	\N	\N
10	6	Sesión 2026-04-15 (objetivo del día): En progreso	activo	en progreso	7	2026-04-15 20:53:07.008364	65	\N	\N
12	8	Sesión 2026-04-19 (objetivo del día): En progreso	activo	en progreso	11	2026-04-19 22:03:17.670054	65	\N	\N
13	9	Sesión 2026-04-19 (objetivo del día): En progreso	activo	en progreso	11	2026-04-19 22:03:17.776153	65	\N	\N
15	8	Sesión 2026-04-19: En progreso	en progreso	en progreso	12	2026-04-19 22:14:11.162457	65	\N	\N
17	10	Sesión 2026-04-19: En progreso	en progreso	en progreso	12	2026-04-19 22:14:11.166009	65	\N	\N
16	7	Sesión 2026-04-19: En progreso	en progreso	en progreso	12	2026-04-19 22:14:11.161529	65	\N	\N
20	7	Sesión 2026-04-21: Nuevo	en progreso	activo	13	2026-04-21 13:13:54.14743	20	\N	\N
19	8	Sesión 2026-04-21: Consolidando	en progreso	en progreso	13	2026-04-21 13:13:54.146321	75	\N	\N
21	11	Sesión 2026-04-21 (objetivo del día): Nuevo	activo	activo	13	2026-04-21 13:13:55.213911	20	\N	\N
22	12	Sesión 2026-04-22 (objetivo del día): Nuevo	activo	activo	14	2026-04-22 17:51:28.339222	20	\N	\N
23	12	Sesión 2026-04-22: Generalizando	activo	logrado	15	2026-04-22 20:37:29.524863	95	\N	\N
24	13	Sesión 2026-04-24 (objetivo del día): En proceso	activo	en progreso	16	2026-04-23 02:12:22.858556	50	\N	\N
26	15	Sesión 2026-04-24 (objetivo del día): En proceso	activo	en progreso	16	2026-04-23 02:12:23.069068	50	\N	\N
28	17	Sesión 2026-04-24 (objetivo del día): Nuevo	activo	activo	17	2026-04-24 12:53:19.857713	20	\N	\N
29	18	Sesión 2026-04-24 (objetivo del día): En proceso	activo	en progreso	18	2026-04-24 12:54:21.672562	50	\N	\N
30	19	Sesión 2026-04-27 (objetivo del día): Nuevo	activo	activo	19	2026-04-27 20:22:50.533459	20	\N	\N
31	20	Sesión 2026-04-27 (objetivo del día): Nuevo	activo	activo	20	2026-04-27 21:31:21.150088	20	\N	\N
32	21	Sesión 2026-04-27 (objetivo del día): En proceso	activo	en progreso	21	2026-04-27 22:34:26.514572	50	\N	\N
102	14	Sesión 2026-04-19: Nuevo	en progreso	activo	74	2026-04-19 23:20:40.208351	20	\N	\N
103	33	Sesión 2026-04-19: Consolidando	en progreso	en progreso	74	2026-04-19 23:20:40.221126	75	\N	\N
104	15	Sesión 2026-04-19: Nuevo	en progreso	activo	75	2026-04-19 23:26:51.049891	20	\N	\N
105	2	Sesión 2026-04-19: Nuevo	en progreso	activo	75	2026-04-19 23:26:51.069306	20	\N	\N
106	33	Sesión 2026-04-19: Consolidando	en progreso	en progreso	75	2026-04-19 23:26:51.071922	75	\N	\N
107	37	Sesión 2026-04-20: Nuevo	en progreso	activo	76	2026-04-20 00:14:21.999022	20	\N	\N
108	38	Sesión 2026-04-20: Consolidando	en progreso	en progreso	76	2026-04-20 00:14:22.010757	75	\N	\N
109	41	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	76	2026-04-20 00:14:22.504829	20	\N	\N
110	40	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	76	2026-04-20 00:14:22.506886	20	\N	\N
111	37	Sesión 2026-04-20: Nuevo	activo	activo	77	2026-04-20 00:14:36.959063	20	\N	\N
112	38	Sesión 2026-04-20: Nuevo	en progreso	activo	77	2026-04-20 00:14:36.970622	20	\N	\N
113	42	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	77	2026-04-20 00:14:37.466596	20	\N	\N
114	43	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	77	2026-04-20 00:14:37.472395	20	\N	\N
115	37	Sesión 2026-04-20: Nuevo	activo	activo	78	2026-04-20 00:14:55.583606	20	\N	\N
116	38	Sesión 2026-04-20: Nuevo	activo	activo	78	2026-04-20 00:14:55.59443	20	\N	\N
117	44	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	78	2026-04-20 00:14:56.058022	20	\N	\N
118	45	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	78	2026-04-20 00:14:56.068644	20	\N	\N
119	37	Sesión 2026-04-20: Nuevo	activo	activo	79	2026-04-20 00:16:56.582046	20	\N	\N
120	38	Sesión 2026-04-20: Nuevo	activo	activo	79	2026-04-20 00:16:56.592464	20	\N	\N
121	47	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	79	2026-04-20 00:16:57.207898	20	\N	\N
122	46	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	79	2026-04-20 00:16:57.22195	20	\N	\N
123	37	Sesión 2026-04-20: Nuevo	activo	activo	80	2026-04-20 00:18:04.324588	20	\N	\N
124	38	Sesión 2026-04-20: Nuevo	activo	activo	80	2026-04-20 00:18:04.375462	20	\N	\N
125	48	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	80	2026-04-20 00:18:04.868622	20	\N	\N
126	49	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	80	2026-04-20 00:18:04.871115	20	\N	\N
127	14	Sesión 2026-04-20: En proceso	activo	en progreso	81	2026-04-20 00:23:23.031974	50	\N	\N
128	29	Sesión 2026-04-20: En proceso	activo	en progreso	81	2026-04-20 00:23:23.034396	50	\N	\N
129	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	81	2026-04-20 00:23:23.049234	75	\N	\N
130	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	82	2026-04-20 00:24:15.408901	75	\N	\N
131	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	82	2026-04-20 00:24:15.425801	50	\N	\N
132	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	82	2026-04-20 00:24:15.430858	50	\N	\N
133	50	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	82	2026-04-20 00:24:15.476157	20	\N	\N
134	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	83	2026-04-20 00:25:21.412654	50	\N	\N
135	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	83	2026-04-20 00:25:21.424471	75	\N	\N
136	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	83	2026-04-20 00:25:21.433217	50	\N	\N
137	51	Sesión 2026-04-20 (objetivo del día): En proceso	activo	en progreso	83	2026-04-20 00:25:21.482413	50	\N	\N
138	40	Sesión 2026-04-20: En proceso	activo	en progreso	84	2026-04-20 00:33:32.847573	50	\N	\N
139	41	Sesión 2026-04-20: En proceso	activo	en progreso	84	2026-04-20 00:33:33.06972	50	\N	\N
140	42	Sesión 2026-04-20: En proceso	activo	en progreso	84	2026-04-20 00:33:33.278675	50	\N	\N
141	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	85	2026-04-20 00:43:23.844999	50	\N	\N
142	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	85	2026-04-20 00:43:23.847709	50	\N	\N
143	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	85	2026-04-20 00:43:23.852607	75	\N	\N
144	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	86	2026-04-20 00:43:53.234789	50	\N	\N
145	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	86	2026-04-20 00:43:53.235923	75	\N	\N
146	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	86	2026-04-20 00:43:53.247252	50	\N	\N
147	40	Sesión 2026-04-20: En proceso	en progreso	en progreso	87	2026-04-20 00:51:37.761594	50	\N	\N
148	41	Sesión 2026-04-20: En proceso	en progreso	en progreso	87	2026-04-20 00:51:37.984227	50	\N	\N
149	42	Sesión 2026-04-20: En proceso	en progreso	en progreso	87	2026-04-20 00:51:38.207516	50	\N	\N
150	40	Sesión 2026-04-20: En proceso	en progreso	en progreso	88	2026-04-20 00:52:14.645846	50	\N	\N
151	41	Sesión 2026-04-20: En proceso	en progreso	en progreso	88	2026-04-20 00:52:14.667509	50	\N	\N
152	42	Sesión 2026-04-20: En proceso	en progreso	en progreso	88	2026-04-20 00:52:14.868725	50	\N	\N
153	40	Sesión 2026-04-19: En proceso	en progreso	en progreso	89	2026-04-20 00:53:51.182202	50	\N	\N
154	41	Sesión 2026-04-19: En proceso	en progreso	en progreso	89	2026-04-20 00:53:51.392098	50	\N	\N
155	42	Sesión 2026-04-19: En proceso	en progreso	en progreso	89	2026-04-20 00:53:51.623818	50	\N	\N
156	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	90	2026-04-20 17:24:17.061341	50	\N	\N
157	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	90	2026-04-20 17:24:17.074814	50	\N	\N
158	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	90	2026-04-20 17:24:17.085855	75	\N	\N
159	40	Sesión 2026-04-20: Nuevo	en progreso	activo	91	2026-04-20 17:24:19.448174	20	\N	\N
160	41	Sesión 2026-04-20: Nuevo	en progreso	activo	91	2026-04-20 17:24:19.449694	20	\N	\N
161	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	92	2026-04-20 17:25:54.451455	50	\N	\N
162	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	92	2026-04-20 17:25:54.459423	50	\N	\N
163	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	92	2026-04-20 17:25:54.469379	75	\N	\N
164	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	93	2026-04-20 17:26:22.510175	50	\N	\N
165	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	93	2026-04-20 17:26:22.511847	75	\N	\N
166	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	93	2026-04-20 17:26:22.526582	50	\N	\N
167	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	94	2026-04-20 17:26:51.666991	50	\N	\N
168	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	94	2026-04-20 17:26:51.668741	50	\N	\N
169	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	94	2026-04-20 17:26:51.681868	75	\N	\N
170	41	Sesión 2026-04-20: En proceso	activo	en progreso	95	2026-04-20 17:30:15.230298	50	\N	\N
171	40	Sesión 2026-04-20: En proceso	activo	en progreso	95	2026-04-20 17:30:15.241517	50	\N	\N
172	42	Sesión 2026-04-20: En proceso	en progreso	en progreso	95	2026-04-20 17:30:15.429692	50	\N	\N
173	52	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	95	2026-04-20 17:30:15.831731	20	\N	\N
174	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	96	2026-04-20 17:36:57.442907	50	\N	\N
175	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	96	2026-04-20 17:36:57.445436	50	\N	\N
176	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	96	2026-04-20 17:36:57.459747	75	\N	\N
177	14	Sesión 2026-04-20: En proceso	en progreso	en progreso	97	2026-04-20 17:43:37.141426	50	\N	\N
178	33	Sesión 2026-04-20: Consolidando	en progreso	en progreso	97	2026-04-20 17:43:37.216007	75	\N	\N
179	29	Sesión 2026-04-20: En proceso	en progreso	en progreso	97	2026-04-20 17:43:37.216971	50	\N	\N
180	40	Sesión 2026-04-20: En proceso	en progreso	en progreso	98	2026-04-20 17:49:46.374901	50	\N	\N
181	41	Sesión 2026-04-20: En proceso	en progreso	en progreso	98	2026-04-20 17:49:46.382961	50	\N	\N
182	42	Sesión 2026-04-20: En proceso	en progreso	en progreso	98	2026-04-20 17:49:46.388036	50	\N	\N
183	53	Sesión 2026-04-20 (objetivo del día): Nuevo	activo	activo	99	2026-04-20 17:52:08.617078	20	\N	\N
184	53	Sesión 2026-04-21: En proceso	activo	en progreso	100	2026-04-21 14:24:07.338859	50	\N	\N
185	54	Sesión 2026-04-21 (objetivo del día): Nuevo	activo	activo	100	2026-04-21 14:24:07.853771	20	\N	\N
186	42	Sesión 2026-04-21: En proceso	en progreso	en progreso	101	2026-04-21 19:55:58.965402	50	\N	\N
187	53	Sesión 2026-04-21: En proceso	en progreso	en progreso	102	2026-04-21 20:03:28.158543	50	\N	\N
188	54	Sesión 2026-04-21: En proceso	activo	en progreso	102	2026-04-21 20:03:28.179486	50	\N	\N
1	3	Sesión 2026-03-30 (objetivo del día): En progreso	activo	en progreso	1	2026-03-30 19:12:53.037893	65	5	2
6	3	Sesión 2026-03-30: En progreso	en progreso	en progreso	4	2026-03-30 22:30:04.680408	65	3	1
11	7	Sesión 2026-04-19 (objetivo del día): En progreso	activo	en progreso	10	2026-04-19 22:02:42.211699	65	\N	\N
14	10	Sesión 2026-04-19 (objetivo del día): En progreso	activo	en progreso	11	2026-04-19 22:03:17.778261	65	\N	\N
18	10	Sesión 2026-04-21: Consolidando	en progreso	en progreso	13	2026-04-21 13:13:53.964452	75	\N	\N
25	14	Sesión 2026-04-24 (objetivo del día): En proceso	activo	en progreso	16	2026-04-23 02:12:22.981165	50	\N	\N
27	16	Sesión 2026-04-24 (objetivo del día): Nuevo	activo	activo	17	2026-04-24 12:53:19.674247	20	\N	\N
\.


--
-- TOC entry 3553 (class 0 OID 24610)
-- Dependencies: 222
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.goals (id, patient_id, title, description, category, status, target_date, created_at, codigo, franja_etaria, goal_library_id, area_clinica, nivel_dificultad, fecha_asignacion, notas, progress_pct) FROM stdin;
1	2	comprension	comprension de texto	lenguaje	en progreso	2026-03-30	2026-03-30 18:34:48.186517	\N	9-10	\N	lenguaje	\N	2026-03-30	Sesión 2026-03-30: En progreso	65
6	5	Producir el fonema /r/ simple en posición intervocálica	El paciente producirá el fonema /r/ simple (cara, puro, torero) en palabras y frases con un 80 % de precisión tras práctica en nivel de sílaba y palabra.	habla	en progreso	\N	2026-04-15 20:53:06.546593	HB-4-6-ART-M-01	3-5	166	habla	intermedio	2026-04-15	Sesión 2026-04-15 (objetivo del día): En progreso	65
20	29	Desarrollar conciencia fonológica: silábica y fonémica	El/la paciente segmentará palabras en sílabas, identificará rimas, reconocerá el fonema inicial y final de palabras, y realizará síntesis silábica con un 80% de acierto.	lectoescritura	activo	\N	2026-04-27 21:31:20.698842	LE-001	6-8	181	lectoescritura	básico	2026-04-27	Sesión 2026-04-27 (objetivo del día): Nuevo	20
21	30	Organizar oraciones	\N	lenguaje	en progreso	\N	2026-04-27 22:34:25.905651	NL-9-12-MS-B-01	9-12	414	lenguaje	básico	2026-04-27	Sesión 2026-04-27 (objetivo del día): En proceso	50
2	2	fonemas y gestos	deberá aplicar fonemas y gestos	lenguaje	en progreso	2026-03-30	2026-03-30 19:07:26.021035	\N	9-10	\N	lenguaje	\N	2026-03-30	Sesión 2026-03-30: En progreso	65
13	11	Imitar gestos faciales simples del adulto (sacar la lengua, abrir la boca)	El niño imitará al menos 3 gestos faciales del adulto (sacar la lengua, sonrisa, abrir la boca) en el 70 % de las oportunidades durante el juego cara a cara.	estimulación temprana	en progreso	\N	2026-04-23 02:12:22.177852	ET-0-2-IMI-B-01	0-2	136	estimulación temprana	básico	2026-04-23	Sesión 2026-04-24 (objetivo del día): En proceso	50
15	11	Imitar gestos y vocalizaciones del adulto	El/la bebé imitará al menos 3 gestos faciales simples (abrir boca, sacar lengua, sonreír) y 3 vocalizaciones (/a/, /m/, /b/) en respuesta al modelado del adulto.	estimulación temprana	en progreso	\N	2026-04-23 02:12:22.507842	ET-002	0-2	141	estimulación temprana	básico	2026-04-23	Sesión 2026-04-24 (objetivo del día): En proceso	50
11	7	Producir textos escritos breves con estructura narrativa	El paciente escribirá un texto narrativo breve (mínimo 5 oraciones) con inicio, desarrollo y desenlace, con cohesión temática y ortografía natural aceptable.	lectoescritura	activo	\N	2026-04-21 13:13:54.607399	LE-6-8-ESC-A-01	6-8	194	lectoescritura	avanzado	2026-04-21	Sesión 2026-04-21 (objetivo del día): Nuevo	20
18	12	Discriminar pares mínimos que difieren en un único fonema	El paciente señalará correctamente la imagen correspondiente al par mínimo escuchado (pala/bala, cama/gama) con un 85 % de aciertos.	habla	en progreso	\N	2026-04-24 12:54:20.976531	HB-4-6-DIS-B-01	3-5	167	habla	básico	2026-04-24	Sesión 2026-04-24 (objetivo del día): En proceso	50
17	12	Imitar secuencias de consonante-vocal en juegos de imitación	El paciente imitará secuencias CV presentadas por el terapeuta (ma, pa, ba, ta, da) con precisión articulatoria en el 80 % de los intentos en contexto lúdico.	habla	activo	\N	2026-04-24 12:53:19.360206	HB-2-4-ART-B-02	3-5	162	habla	básico	2026-04-24	Sesión 2026-04-24 (objetivo del día): Nuevo	20
14	11	Vocalizar en respuesta a la voz del adulto (protoconversación)	El niño responderá vocalmente al habla del adulto durante intercambios de protoconversación, alternando las vocalizaciones con las del adulto en el 70 % de las oportunidades.	estimulación temprana	en progreso	\N	2026-04-23 02:12:22.505531	ET-0-2-PRV-B-01	0-2	138	estimulación temprana	básico	2026-04-23	Sesión 2026-04-24 (objetivo del día): En proceso	50
16	12	Discriminar auditivamente pares mínimos de fonemas	El/la paciente discriminará de forma auditiva pares mínimos que difieran en un único rasgo fonológico (ej. /p/-/b/, /t/-/d/, /s/-/z/) con un 80% de acierto.	habla	activo	\N	2026-04-24 12:53:19.149182	HA-005	3-5	160	habla	básico	2026-04-24	Sesión 2026-04-24 (objetivo del día): Nuevo	20
12	8	Discriminar auditivamente pares mínimos de fonemas	El/la paciente discriminará de forma auditiva pares mínimos que difieran en un único rasgo fonológico (ej. /p/-/b/, /t/-/d/, /s/-/z/) con un 80% de acierto.	habla	logrado	\N	2026-04-22 17:51:27.712054	HA-005	3-5	160	habla	básico	2026-04-22	Sesión 2026-04-22: Generalizando	95
7	7	Fonemas con gesto	\N	lectoescritura	activo	\N	2026-04-19 22:02:41.525234	LE-8-10-CF-B-01	8-10	383	lectoescritura	básico	2026-04-19	Sesión 2026-04-21: Nuevo	20
3	3	organizacion lexica	organizar oraciones	lenguaje	en progreso	\N	2026-03-30 19:12:52.549959	NL-0-0-GEN-B-01	\N	1	lenguaje	básico	2026-03-30	Sesión 2026-04-06: En progreso	65
5	3	Describir objetos por atributos (color, tamaño, función)	El paciente describe un objeto o imagen incluyendo al menos 3 atributos (nombre, función, color/tamaño o pertenencia a categoría), en al menos el 75% de los intentos.	lenguaje	en progreso	\N	2026-04-06 22:22:36.163624	NL-LEX-I-03	\N	13	lenguaje	intermedio	2026-04-06	Sesión 2026-04-06 (objetivo del día): En progreso	65
9	7	Producir textos escritos con cohesión y coherencia básica	El/la paciente producirá textos escritos de al menos 5 oraciones con tema central identificable, uso de conectores y ortografía consistente con su nivel escolar.	lectoescritura	en progreso	\N	2026-04-19 22:03:17.19872	LE-004	6-8	184	lectoescritura	avanzado	2026-04-19	Sesión 2026-04-19 (objetivo del día): En progreso	65
10	7	Fonemas con gesto	\N	lectoescritura	en progreso	\N	2026-04-19 22:03:17.207923	LE-8-10-CF-B-01	8-10	383	lectoescritura	básico	2026-04-19	Sesión 2026-04-21: Consolidando	75
8	7	Comprender textos breves respondiendo preguntas literales e inferenciales	El/la paciente leerá textos de 3-5 oraciones y responderá correctamente al menos el 80% de preguntas literales e inferenciales simples sobre lo leído.	lectoescritura	en progreso	\N	2026-04-19 22:03:17.01913	LE-003	6-8	183	lectoescritura	intermedio	2026-04-19	Sesión 2026-04-21: Consolidando	75
19	28	Establecer metas y organizar pasos para completar un proyecto	El paciente planificará un proyecto simple (preparar una presentación, organizar un cuento) definiendo 3-4 pasos con secuencia lógica y ejecutándolos con supervisión mínima.	cognición	activo	\N	2026-04-27 20:22:49.8983	CG-6-8-EJE-A-01	6-8	43	cognición	avanzado	2026-04-27	Sesión 2026-04-27 (objetivo del día): Nuevo	20
24	6	Imitar movimientos labiales básicos (beso, sonrisa, morritos) ante el espejo	El paciente imitará 5 movimientos labiales distintos (beso, sonrisa, vibración, protrusión, retracción) ante el espejo con el 80 % de precisión en 3 sesiones.	motricidad orofacial	activo	\N	2026-03-18 19:23:08.099581	MO-2-4-PRX-B-01	2-4	170	motricidad orofacial	básico	2026-03-18	\N	\N
25	6	Fortalecer musculatura lingual mediante ejercicios de resistencia	El paciente empujará con la lengua contra una espátula durante 5 segundos en 5 repeticiones, manteniendo la posición en al menos 4 de 5 intentos.	motricidad orofacial	activo	\N	2026-03-18 19:23:42.78033	MO-4-6-TON-B-01	4-6	174	motricidad orofacial	básico	2026-03-18	\N	\N
30	4	Recuperar información de la memoria a largo plazo para resolver tareas escolares	El paciente recuperará información aprendida en sesiones previas (vocabulario, reglas, procedimientos) para aplicarla en tareas nuevas con un 80 % de aciertos sin pistas.	cognición	en progreso	\N	2026-03-28 21:22:33.43396	CG-6-8-MEM-A-01	6-8	202	cognición	avanzado	2026-03-28	Sesión 2026-03-28 (objetivo del día): En progreso	65
37	15	Desarrollar juego simbólico simple con muñecos y figuras	El niño realizará secuencias de 2-3 acciones simbólicas con muñecos (darle de comer, acostarlos, bañarlos) de forma espontánea durante el juego libre en la sesión.	estimulación temprana	activo	\N	2026-04-17 01:46:58.526916	ET-2-4-JUE-M-01	3-5	228	estimulación temprana	intermedio	2026-04-17	Sesión 2026-04-20: Nuevo	20
23	6	Mejorar el tono muscular labial y lingual	El/la paciente incrementará el tono y la fuerza muscular de labios y lengua mediante ejercicios de resistencia y estimulación, observando mejora en la postura de reposo y en la articulación.	motricidad orofacial	en progreso	\N	2026-03-18 19:22:45.891773	MO-001	2-6	41	motricidad orofacial	básico	2026-03-18	se cansa	40
28	6	Aplicar técnica de habla lenta y fluida en lectura oral de palabras	El paciente leerá listas de palabras aplicando habla lenta y continua (prolongación vocálica inicial) con menos de 3 disfluencias por cada 100 palabras.	habla	activo	\N	2026-03-19 03:31:11.009591	HB-4-6-FLU-B-01	4-6	137	habla	básico	2026-03-19	n	15
31	2	Comprender que los demás pueden tener creencias diferentes a las propias	En tareas de falsa creencia de primer orden, el paciente predecirá correctamente lo que pensará un personaje que no tuvo acceso a nueva información, con un 75 % de aciertos.	comunicación social	logrado	\N	2026-03-28 22:17:23.927581	SC-4-6-INF-B-02	4-6	426	comunicación social	básico	2026-03-28	Sesión 2026-04-03: Logrado	100
26	4	Usar el vocabulario emocional para describir estados internos propios y ajenos	El paciente usará un vocabulario emocional preciso y matizado (decepción, gratitud, indignación, melancolía) para describir estados propios y ajenos en contextos clínicos y naturales.	comunicación social	en progreso	\N	2026-03-18 19:53:21.553192	SC-8-10-EMO-A-02	8-10	424	comunicación social	avanzado	2026-03-18	Sesión 2026-03-28: En progreso	65
32	1	Producir vocales y consonantes bilabiales en posición inicial	El paciente producirá las vocales y las consonantes /p/, /b/, /m/ en posición inicial de sílaba al imitar al terapeuta con un 80 % de precisión articulatoria.	habla	activo	\N	2026-03-29 17:16:11.929176	HB-2-4-ART-B-01	2-4	129	habla	básico	2026-03-29	\N	\N
41	15	Seguimiento visual de objetos en movimiento	El/la bebé rastreará visualmente un objeto en movimiento en planos horizontal, vertical y circular, manteniendo la mirada por al menos 3 segundos.	estimulación temprana	en progreso	\N	2026-04-20 00:14:22.254652	ET-001	0-2	54	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20: En proceso	50
4	4	memoria de trabajo	\N	cognición	en progreso	\N	2026-03-31 00:35:41.834437	CG-0-0-GEN-B-01	\N	3	cognición	básico	2026-03-31	Sesión 2026-03-31 (objetivo del día): En progreso	65
35	2	Nombrar objetos cotidianos del entorno inmediato	El paciente nombrará al menos 10 objetos cotidianos (taza, silla, zapato, etc.) cuando el terapeuta los señale o presente, con un 80 % de precisión en 3 sesiones consecutivas.	lenguaje	en progreso	\N	2026-04-03 19:22:42.455728	NL-2-4-LEX-B-01	2-4	101	lenguaje	básico	2026-04-03	Sesión 2026-04-03 (objetivo del día): En progreso	65
34	2	Ampliar el vocabulario expresivo en contexto funcional	El/la paciente incrementará su léxico expresivo nominando correctamente objetos, personas y acciones de su entorno cotidiano, en situaciones espontáneas y estructuradas.	lenguaje	en progreso	\N	2026-04-03 19:22:42.45488	NL-001	2-4	23	lenguaje	básico	2026-04-03	Sesión 2026-04-03 (objetivo del día): En progreso	65
22	5	Reconocer expresiones faciales de las 4 emociones básicas	El paciente señalará o nombrará la expresión facial correcta (feliz, triste, enojado, asustado) en fotografías de caras con un 80 % de aciertos en 20 ítems.	comunicación social	en progreso	\N	2026-03-18 19:16:59.891917	SC-2-4-EMO-B-01	2-4	414	comunicación social	básico	2026-03-18	Sesión 2026-04-04: En progreso	65
36	5	Reducir el proceso fonológico de omisión de consonante final	El paciente producirá palabras CV+C (pan, sol, mar) conservando la consonante final en el 80 % de los intentos en actividades dirigidas.	habla	logrado	\N	2026-04-04 03:42:58.654518	HB-2-4-FON-B-01	2-4	130	habla	básico	2026-04-04	Sesión 2026-04-04: Logrado	100
27	3	Establecer metas y organizar pasos para completar un proyecto	El paciente planificará un proyecto simple (preparar una presentación, organizar un cuento) definiendo 3-4 pasos con secuencia lógica y ejecutándolos con supervisión mínima.	cognición	en progreso	\N	2026-03-19 03:04:56.95754	CG-6-8-EJE-A-01	6-8	199	cognición	avanzado	2026-03-19	Sesión 2026-04-09: En progreso	65
33	1	Reconocer y leer palabras monosílabas y bisílabas	El/la paciente leerá palabras monosílabas y bisílabas de vocabulario frecuente con decodificación fonológica correcta en al menos el 80% de los intentos.	lectoescritura	en progreso	\N	2026-04-03 18:14:24.020695	LE-002	5-7	46	lectoescritura	básico	2026-04-03	Sesión 2026-04-20: Consolidando	75
39	1	Objetivo de prueba paciente		lenguaje	activo	\N	2026-04-17 14:18:37.136032	NL-0-0-GEN-B-03	\N	456	lenguaje	básico	2026-04-17	\N	\N
43	15	Seguimiento visual de objetos en movimiento	El/la bebé rastreará visualmente un objeto en movimiento en planos horizontal, vertical y circular, manteniendo la mirada por al menos 3 segundos.	estimulación temprana	activo	\N	2026-04-20 00:14:37.218151	ET-001	0-2	54	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
48	15	Seguimiento visual de objetos en movimiento	El/la bebé rastreará visualmente un objeto en movimiento en planos horizontal, vertical y circular, manteniendo la mirada por al menos 3 segundos.	estimulación temprana	activo	\N	2026-04-20 00:18:04.593443	ET-001	0-2	54	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
44	15	Comprender palabras funcionales del entorno familiar	El/la niño/a comprenderá al menos 20 palabras de su entorno cotidiano (nombres de personas, objetos del hogar, acciones básicas) respondiendo con acción, señal o mirada.	estimulación temprana	activo	\N	2026-04-20 00:14:55.824819	ET-003	0-2	56	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
45	15	Seguimiento visual de objetos en movimiento	El/la bebé rastreará visualmente un objeto en movimiento en planos horizontal, vertical y circular, manteniendo la mirada por al menos 3 segundos.	estimulación temprana	activo	\N	2026-04-20 00:14:55.825425	ET-001	0-2	54	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
49	15	Comprender palabras funcionales del entorno familiar	El/la niño/a comprenderá al menos 20 palabras de su entorno cotidiano (nombres de personas, objetos del hogar, acciones básicas) respondiendo con acción, señal o mirada.	estimulación temprana	activo	\N	2026-04-20 00:18:04.603534	ET-003	0-2	56	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
47	15	Seguimiento visual de objetos en movimiento	El/la bebé rastreará visualmente un objeto en movimiento en planos horizontal, vertical y circular, manteniendo la mirada por al menos 3 segundos.	estimulación temprana	activo	\N	2026-04-20 00:16:56.857996	ET-001	0-2	54	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
46	15	Comprender palabras funcionales del entorno familiar	El/la niño/a comprenderá al menos 20 palabras de su entorno cotidiano (nombres de personas, objetos del hogar, acciones básicas) respondiendo con acción, señal o mirada.	estimulación temprana	activo	\N	2026-04-20 00:16:56.856269	ET-003	0-2	56	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
38	15	Comprender preguntas simples (¿qué es? ¿dónde está?) sin apoyo gestual	El niño responderá apropiadamente a preguntas simples (¿qué es esto? ¿dónde está la pelota?) señalando o nombrando, en el 75 % de los intentos sin que el adulto use gestos.	estimulación temprana	activo	\N	2026-04-17 01:46:58.53935	ET-2-4-COM-M-01	3-5	233	estimulación temprana	intermedio	2026-04-17	Sesión 2026-04-20: Nuevo	20
50	1	Identificar absurdos verbales simples	El paciente identifica y explica por qué una oración o situación es absurda, en al menos el 75% de los ítems presentados.	lenguaje	activo	\N	2026-04-20 00:24:15.452691	NL-COMP-I-01	6-8	447	lenguaje	intermedio	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
51	1	Objetivo personalizado QA 1776644712171	\N	lenguaje	en progreso	\N	2026-04-20 00:25:21.458399	NL-0-0-GEN-B-09	\N	499	lenguaje	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): En proceso	50
52	15	Vocalizar en respuesta a la voz del adulto (protoconversación)	El niño responderá vocalmente al habla del adulto durante intercambios de protoconversación, alternando las vocalizaciones con las del adulto en el 70 % de las oportunidades.	estimulación temprana	activo	\N	2026-04-20 17:30:15.629353	ET-0-2-PRV-B-01	0-2	222	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20 (objetivo del día): Nuevo	20
54	16	Mejorar la planificación y organización en tareas cotidianas	El/la paciente secuenciará pasos para completar una tarea de múltiples etapas, anticipará materiales necesarios y seguirá el plan con supervisión mínima.	cognición	en progreso	\N	2026-04-21 14:24:07.587796	CO-003	9-12	51	cognición	intermedio	2026-04-21	Sesión 2026-04-21: En proceso	50
29	1	Establecer metas y organizar pasos para completar un proyecto	El paciente planificará un proyecto simple (preparar una presentación, organizar un cuento) definiendo 3-4 pasos con secuencia lógica y ejecutándolos con supervisión mínima.	cognición	en progreso	\N	2026-03-24 18:02:28.321005	CG-6-8-EJE-A-01	6-8	199	cognición	avanzado	2026-03-24	Sesión 2026-04-20: En proceso	50
42	15	Comprender palabras funcionales del entorno familiar	El/la niño/a comprenderá al menos 20 palabras de su entorno cotidiano (nombres de personas, objetos del hogar, acciones básicas) respondiendo con acción, señal o mirada.	estimulación temprana	en progreso	\N	2026-04-20 00:14:37.21761	ET-003	0-2	56	estimulación temprana	básico	2026-04-20	Sesión 2026-04-21: En proceso	50
40	15	Comprender palabras funcionales del entorno familiar	El/la niño/a comprenderá al menos 20 palabras de su entorno cotidiano (nombres de personas, objetos del hogar, acciones básicas) respondiendo con acción, señal o mirada.	estimulación temprana	en progreso	\N	2026-04-20 00:14:22.254025	ET-003	0-2	56	estimulación temprana	básico	2026-04-20	Sesión 2026-04-20: En proceso	50
53	16	Aplicar la memoria de trabajo en tareas de comprensión lectora compleja	El paciente mantendrá información de párrafos anteriores activa mientras lee textos complejos, integrando información a lo largo del texto para responder preguntas de comprensión global.	cognición	en progreso	\N	2026-04-20 17:52:08.404126	CG-8-10-WME-A-02	9-12	306	cognición	avanzado	2026-04-20	Sesión 2026-04-21: En proceso	50
\.


--
-- TOC entry 3572 (class 0 OID 98305)
-- Dependencies: 241
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos (id, patient_id, monto, mes, tipo, nombre_obra_social, fecha, estado, notas, user_id, created_at, updated_at) FROM stdin;
2	16	140000.00	2026-02	obra_social	osprera	2026-04-23	pagado		1	2026-04-23 19:19:34.994754	2026-04-23 19:19:34.994754
3	16	1410000.00	2026-04	obra_social	osprera	2026-04-23	pagado	\N	1	2026-04-23 19:21:12.692942	2026-04-23 19:21:37.734
4	1	25000.00	2026-04	particular	\N	2026-04-23	pagado	\N	1	2026-04-23 19:29:06.294663	2026-04-23 19:29:06.294663
5	15	256000.00	2026-03	particular	\N	2026-04-23	pagado	\N	5	2026-04-23 19:31:02.615949	2026-04-23 19:31:02.615949
6	15	256000.00	2026-03	particular	\N	2026-04-23	pagado	\N	5	2026-04-23 19:31:24.689328	2026-04-23 19:31:40.303
7	15	256.00	2026-03	particular	\N	2026-04-23	pagado	\N	5	2026-04-23 19:31:59.081837	2026-04-23 19:31:59.081837
9	16	141.00	2026-02	obra_social	osprera	2026-04-23	pagado	\N	5	2026-04-23 19:43:27.467614	2026-04-23 19:43:27.467614
1	24	100.00	2026-04	particular	\N	2026-04-25	pagado	\N	3	2026-04-25 01:52:40.357239	2026-04-25 01:52:40.357239
\.


--
-- TOC entry 3561 (class 0 OID 32779)
-- Dependencies: 230
-- Data for Name: patient_professionals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_professionals (id, patient_id, professional_id, created_at) FROM stdin;
1	1	1	2026-03-13 19:27:03.72492
2	1	2	2026-03-13 19:27:03.72492
3	2	1	2026-03-13 19:27:03.72492
4	2	2	2026-03-13 19:27:03.72492
5	3	1	2026-03-13 19:27:03.72492
6	3	2	2026-03-13 19:27:03.72492
\.


--
-- TOC entry 3547 (class 0 OID 24577)
-- Dependencies: 216
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (id, name, age, diagnosis, profesional_nombre, franja_etaria, fecha_inicio, progreso, promedio_desempeno, semaforo, observaciones, informe_evolucion, informe_mensual, created_at, fecha_nacimiento, motivo_consulta, antecedentes, historia_familiar, escolaridad, informe_familia, assigned_professional_id, lenguaje_comunicacion, atencion_conducta, voz_habla, deglucion, impresion_clinica) FROM stdin;
2	Álvaro Sampietro	10	Tdah	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 18:16:52.852162	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	fausto sampietro	8	tdah	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 19:11:33.85145	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	lautaro farias	7	tda	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-30 19:11:56.538034	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	Helena	4	Tsh	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-15 20:47:59.808419	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	Mika	3	\N	jaqui	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-17 01:55:47.971886	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N
7	Alvaro Sampietro	10	TDA	jaqui	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-19 21:55:15.388426	\N	Posee certificado de discapacidad	Tda y dislexia	\N	6 t grado turno tarde	\N	2	\N	\N	\N	\N	\N
8	Helena	4	Tsh	jaqui	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 15:51:41.481654	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N
9	Hanna	8	Hipoacusia	jaqui	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 15:51:54.845138	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N
10	Darian	12	\N	jaqui	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-22 15:52:07.518798	\N	\N	\N	\N	\N	\N	2	\N	\N	\N	\N	\N
11	Gonzalo Soler	15	RM TDL	Lic. Natalia	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-23 02:08:45.545909	\N	\N	\N	\N	\N	\N	5	\N	\N	\N	\N	\N
12	Demo 1	5	Tsh	Administrador	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 12:51:06.957971	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N
15	Amaris	3	Estimulación del lenguaje	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:25:27.82696	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
16	Thiago	10	Pte traqueostomía	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:25:53.522984	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
1	Bruno	5	Tsh	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-28 19:44:53.338401	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
13	Miguel Ángel Pintor	76	Párkinson	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:24:15.274566	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
14	Agustín Andrés Delgado	6	Tsh	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:24:52.220035	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
17	Mia	6	Estimulación del lenguaje, corrección en la articulación	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:26:17.142262	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
19	Bautista	12	Retraso mental moderado	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:27:21.057938	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
20	Zoe	4	Retraso del lenguaje	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:28:01.985939	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
21	Bautista Leonel Delgado	3	Retraso del lenguaje	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:29:36.193388	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
18	Joaquín	5	Tsh	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:27:01.082207	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
22	Ferreyra Alison Martina	4	Retraso del lenguaje	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:33:06.256011	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
23	Leocadio	8	Retraso del lenguaje moderado	Guada	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-24 14:35:21.721183	\N	\N	\N	\N	\N	\N	6	\N	\N	\N	\N	\N
24	Demo 1	6	Tdl	Mili	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 01:51:28.483661	\N	\N	\N	\N	\N	\N	3	\N	\N	\N	\N	\N
25	Lucas Abel Maldonado Romero	8	trastornos del lenguaje	Braian Galvan	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 22:32:54.318536	\N	\N	\N	\N	\N	\N	7	\N	\N	\N	\N	\N
26	Agustín Chávez	5	Autismo	Braian Galvan	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 22:33:15.278464	\N	\N	\N	\N	\N	\N	7	\N	\N	\N	\N	\N
27	Nathan Cabrera	5	Trastorno del lenguaje	Braian Galvan	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-25 22:33:46.245282	\N	\N	\N	\N	\N	\N	7	\N	\N	\N	\N	\N
28	Lautaro	7	Tdah	Administrador	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 20:19:31.245148	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N
29	Alvaro	11	Dislexia	Administrador	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 21:21:06.686392	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N
30	Fusto	9	Tdl	Administrador	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-27 22:29:30.648631	\N	\N	\N	\N	\N	\N	1	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3549 (class 0 OID 24587)
-- Dependencies: 218
-- Data for Name: professionals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.professionals (id, name, email, phone, specialty, license, status, patient_count, created_at) FROM stdin;
1	Dra. María López	mlopez@neurometric.com	+54 11 5555-0001	Fonoaudiología	MP-12345	active	0	2026-03-13 19:27:03.689227
2	Lic. Carlos Ruiz	cruiz@neurometric.com	+54 11 5555-0002	Psicología Infantil	MP-23456	active	0	2026-03-13 19:27:03.689227
3	Lic. Ana Gómez	agomez@neurometric.com	+54 11 5555-0003	Neuropsicología	MP-34567	active	0	2026-03-13 19:27:03.689227
\.


--
-- TOC entry 3557 (class 0 OID 24633)
-- Dependencies: 226
-- Data for Name: registros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros (id, patient_id, patient_name, sesion_numero, objetivo_nombre, goal_library_id, area_objetivo, fecha, estado, intentos, intentos_sugeridos, correctas, porcentaje, cumple_meta, recomendacion_clinica, informe_sesion, act_clinicas_obj, act_familia_obj, franja_paciente, created_at) FROM stdin;
1	1	Alvaro	6	Narración estructurada de secuencias	9	Lenguaje Narrativo	2 de marzo de 2026 15:52	En proceso	10	10	10	100%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Narración estructurada de secuencias\n📊 Intentos: 10 | Correctas: 10 | Desempeño: 100%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nRelatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace\n\n🏠 Actividades para familia:\n\n• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace	• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día	4-5	2026-03-13 00:13:42.412448
2	1	Alvaro	5	Narración estructurada de secuencias	9	Lenguaje Narrativo	6 de marzo de 2026 15:17	En proceso	10	10	4	40%	No	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Narración estructurada de secuencias\n📊 Intentos: 10 | Correctas: 4 | Desempeño: 40%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nRelatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace\n\n🏠 Actividades para familia:\n\n• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace	• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día	4-5	2026-03-13 00:13:42.412448
3	1	Alvaro	4	Denominación espontánea de objetos familiares	18	Léxico	7 de marzo de 2026 0:06	En proceso	10	10	10	100%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Denominación espontánea de objetos familiares\n📊 Intentos: 10 | Correctas: 10 | Desempeño: 100%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nCaja sorpresa con objetos familiares para nombrar.\n\nJuego de clasificación de objetos cotidianos.\n\nTarjetas o imágenes de objetos conocidos.\n\nJuego simbólico con objetos reales.\n\nLotería o memotest de vocabulario básico.\n\n🏠 Actividades para familia:\nNombrar objetos del hogar durante rutinas cotidianas.\n\nPedir al niño que nombre objetos antes de entregarlos.\n\nLeer libros de imágenes simples y pedir que diga qué ve.\n\nJugar a buscar objetos en la casa y nombrarlos.\n\nReforzar positivamente cada intento de denominación.\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Caja sorpresa con objetos familiares para nombrar.\n\nJuego de clasificación de objetos cotidianos.\n\nTarjetas o imágenes de objetos conocidos.\n\nJuego simbólico con objetos reales.\n\nLotería o memotest de vocabulario básico.	Nombrar objetos del hogar durante rutinas cotidianas.\n\nPedir al niño que nombre objetos antes de entregarlos.\n\nLeer libros de imágenes simples y pedir que diga qué ve.\n\nJugar a buscar objetos en la casa y nombrarlos.\n\nReforzar positivamente cada intento de denominación.	4-5	2026-03-13 00:13:42.412448
4	2	Bruno	2	Denominación espontánea de objetos familiares	18	Léxico	7 de marzo de 2026 0:31	En proceso	8	10	3	37,5%	No	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Denominación espontánea de objetos familiares\n📊 Intentos: 8 | Correctas: 3 | Desempeño: 38%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nCaja sorpresa con objetos familiares para nombrar.\n\nJuego de clasificación de objetos cotidianos.\n\nTarjetas o imágenes de objetos conocidos.\n\nJuego simbólico con objetos reales.\n\nLotería o memotest de vocabulario básico.\n\n🏠 Actividades para familia:\nNombrar objetos del hogar durante rutinas cotidianas.\n\nPedir al niño que nombre objetos antes de entregarlos.\n\nLeer libros de imágenes simples y pedir que diga qué ve.\n\nJugar a buscar objetos en la casa y nombrarlos.\n\nReforzar positivamente cada intento de denominación.\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Caja sorpresa con objetos familiares para nombrar.\n\nJuego de clasificación de objetos cotidianos.\n\nTarjetas o imágenes de objetos conocidos.\n\nJuego simbólico con objetos reales.\n\nLotería o memotest de vocabulario básico.	Nombrar objetos del hogar durante rutinas cotidianas.\n\nPedir al niño que nombre objetos antes de entregarlos.\n\nLeer libros de imágenes simples y pedir que diga qué ve.\n\nJugar a buscar objetos en la casa y nombrarlos.\n\nReforzar positivamente cada intento de denominación.	4-5	2026-03-13 00:13:42.412448
5	2	Bruno	1	Uso adecuado de conectores temporales y causales	8	Lenguaje Expresivo	8 de marzo de 2026 0:48	En proceso	10	10	3	30%	No	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Uso adecuado de conectores temporales y causales\n📊 Intentos: 10 | Correctas: 3 | Desempeño: 30%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nOrdenar secuencias temporalesCompletar historias con conectoresJuegos de causa–efectoRelatos con tarjetas narrativas\n\n🏠 Actividades para familia:\n\n• Preguntar “¿por qué?” y “¿qué pasó después?”\n• Modelar conectores al hablar\n• Narrar rutinas paso a paso\n• Leer cuentos y comentar secuencias\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Ordenar secuencias temporalesCompletar historias con conectoresJuegos de causa–efectoRelatos con tarjetas narrativas	• Preguntar “¿por qué?” y “¿qué pasó después?”\n• Modelar conectores al hablar\n• Narrar rutinas paso a paso\n• Leer cuentos y comentar secuencias	4-5	2026-03-13 00:13:42.412448
6	3	Fausto	1	Combinación palabra + gesto significativo	17	Comunicación	8 de marzo de 2026 0:53	En proceso	10	10	7	70%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Combinación palabra + gesto significativo\n📊 Intentos: 10 | Correctas: 7 | Desempeño: 70%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\n Señalar y nombrar\nJuegos de pedir objetos\nModelado gestual\nComunicación intencional\n\n🏠 Actividades para familia:\nModelar gestos comunicativos\nReforzar señalamiento\nJuegos de pedir\nRutinas comunicativas\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Señalar y nombrar\nJuegos de pedir objetos\nModelado gestual\nComunicación intencional	Modelar gestos comunicativos\nReforzar señalamiento\nJuegos de pedir\nRutinas comunicativas	7-8	2026-03-13 00:13:42.412448
7	1	Alvaro	3	Narración estructurada de secuencias	9	Lenguaje Narrativo	8 de marzo de 2026 16:04	En proceso	10	10	10	100%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Narración estructurada de secuencias\n📊 Intentos: 10 | Correctas: 10 | Desempeño: 100%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nRelatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace\n\n🏠 Actividades para familia:\n\n• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace	• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día	4-5	2026-03-13 00:13:42.412448
8	1	Alvaro	2	Narración estructurada de secuencias	9	Lenguaje Narrativo	8 de marzo de 2026 16:32	En proceso	10	10	10	100%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Narración estructurada de secuencias\n📊 Intentos: 10 | Correctas: 10 | Desempeño: 100%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nRelatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace\n\n🏠 Actividades para familia:\n\n• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace	• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día	4-5	2026-03-13 00:13:42.412448
9	1	Alvaro	1	Narración estructurada de secuencias	9	Lenguaje Narrativo	8 de marzo de 2026 22:47	En proceso	10	10	10	100%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: @Narración estructurada de secuencias\n📊 Intentos: 10 | Correctas: 10 | Desempeño: 100%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\nRelatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace\n\n🏠 Actividades para familia:\n\n• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	Relatar historias con pictogramasNarración guiada con preguntasReordenar viñetasContar historias inventadasJuegos de inicio–nudo–desenlace	• Contar qué pasó en la escuela\n• Relatar películas o cuentos\n• Juegos de inventar historias\n• Secuenciar actividades del día	4-5	2026-03-13 00:13:42.412448
10	1	Alvaro	\N	\N	\N	\N	8 de marzo de 2026 23:14	En proceso	10	\N	10	100%	Yes	🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	📌 Objetivo trabajado: \n📊 Intentos: 10 | Correctas: 10 | Desempeño: 100%\n🧠 Estado: En proceso\n\n🩺 Actividades clínicas sugeridas:\n\n\n🏠 Actividades para familia:\n\n\n✅ Recomendación clínica:\n🟡 Objetivo en proceso. Se sugiere continuar con intervención específica y reforzar práctica en hogar para favorecer generalización.	\N	\N	4-5	2026-03-13 00:13:42.412448
\.


--
-- TOC entry 3559 (class 0 OID 32769)
-- Dependencies: 228
-- Data for Name: registros_clinicos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros_clinicos (id, patient_id, patient_name, professional_id, professional_name, fecha, resumen_sesion, observaciones, recomendaciones_hogar, created_at, user_id) FROM stdin;
96	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 17:36:57.411715	1
97	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 17:43:37.107282	1
98	15	Mika Paz	\N	Jaqui	2026-04-20	\N	\N	\N	2026-04-20 17:49:46.168624	5
99	16	Lautaro	\N	Jaqui	2026-04-20	trabajo bien	\N	\N	2026-04-20 17:52:08.18024	5
100	16	Lautaro	\N	Jaqui	2026-04-21	trabaja y se cansa , le cuesta sostener la indicacion , necesita andamiaje del terapeuta	\N	\N	2026-04-21 14:24:07.078015	5
101	15	Mika Paz	\N	Jaqui	2026-04-21	\N	\N	\N	2026-04-21 19:55:58.611272	5
102	16	Lautaro	\N	Jaqui	2026-04-21	Se realizó sesión con Lautaro, 9 años, en el contexto de trastorno por déficit de atención e hiperactividad (TDAH). El trabajo se centró en regulación atencional, planificación y autorregulación conductual. Se trabajaron 2 objetivos: "Aplicar la memoria de trabajo en tareas de comprensión lectora compleja", "Mejorar la planificación y organización en tareas cotidianas", con desempeño en proceso de adquisición. Se observó capacidad de sostenimiento atencional dentro de los rangos esperados para las actividades propuestas, con respuesta positiva a las estrategias de estructuración.	\N	\N	2026-04-21 20:03:27.890907	5
1	3	fausto sampietro	\N	\N	2026-03-30	demo	\N	\N	2026-03-30 19:12:52.174515	\N
2	2	Álvaro Sampietro	\N	\N	2026-03-30	\N	Trabajamos imágenes de comprensión con imágenes \nBien \nAveces en la lectura confundía la consigna, al repetirla sin leer	\N	2026-03-30 21:20:19.756914	\N
10	7	Alvaro Sampietro	\N	\N	2026-04-19	El niño logró poco la consigna realizada\nSe continuará evaluando 	Hayan continuar trabjando	\N	2026-04-19 22:02:40.997948	\N
17	12	Demo 1	\N	Administrador	2026-04-24	Se realizó sesión con Demo, 5 años, en el contexto de trastorno de los sonidos del habla (TSH). El foco de la sesión se centró en producción del habla, articulación y sonidos del habla. Se trabajaron 2 objetivos: "Discriminar auditivamente pares mínimos de fonemas", "Imitar secuencias de consonante-vocal en juegos de imitación". Desempeño predominante: en abordaje inicial. El paciente presentó trabajo articulatorio con retroalimentación auditiva y visual. Se evidencian avances en la producción de los fonemas trabajados durante la sesión. Se recomienda práctica breve y motivadora en casa de los sonidos trabajados, sin corrección directa y celebrando todos los intentos positivos.	\N	\N	2026-04-24 12:53:18.734246	1
22	1	Alvaro	\N	Lic.Marquez	2026-03-18	\N	\N	\N	2026-03-18 18:39:05.676315	1
23	1	Alvaro	\N	Lic.Marquez	2026-03-18	\N	\N	\N	2026-03-18 19:07:47.397047	1
24	6	Helena	\N	Lic.Marquez	2026-03-18	\N	\N	\N	2026-03-18 19:17:23.731315	1
25	6	Helena	\N	Lic.Marquez	2026-03-18	Trabajar tono muscular	Trabaja bien 	\N	2026-03-18 19:22:01.081003	1
26	6	Helena	\N	Lic.Marquez	2026-03-18	\N	\N	\N	2026-03-18 19:24:28.734169	1
27	8	Pili	\N	Lic.Marquez	2026-03-18	\N	\N	\N	2026-03-18 19:48:12.060576	1
28	4	Paciente Test E2E	\N	Lic.Marquez	2026-03-18	\N	\N	\N	2026-03-18 19:53:21.488445	1
29	3	Fausto	\N	Lic.Marquez	2026-03-19	\N	\N	\N	2026-03-19 03:04:56.210025	1
30	6	Helena	\N	Lic.Marquez	2026-03-19	\N	\N	\N	2026-03-19 03:31:09.381154	1
31	1	Alvaro	\N	Lic.Marquez	2026-03-24	trabaj bien tranquilo y concentrado	\N	\N	2026-03-24 18:02:27.201445	1
32	4	Paciente Test E2E	\N	Lic.Marquez	2026-03-28	\N	\N	\N	2026-03-28 21:22:33.099973	1
33	2	Bruno	\N	Lic.Marquez	2026-03-28	estuvo regulado	le cuesta relajar	\N	2026-03-28 22:17:22.826034	1
34	1	Alvaro	\N	Lic.Marquez	2026-03-29	\N	\N	\N	2026-03-29 17:25:34.460271	1
67	1	Alvaro	\N	Lic.Marquez	2026-03-30	Verificación de edición de sesión	me gustaría que se siente más derecho	\N	2026-03-30 18:05:15.415166	1
68	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-03	\N	trabao bien le cuesta separar en silabas	\N	2026-04-03 18:14:23.370322	1
69	2	Bruno	\N	Lic.Marquez	2026-04-03	\N	\N	\N	2026-04-03 19:22:41.867499	1
70	5	Ana García	\N	Lic.Marquez	2026-04-04	\N	la paciente trabajó tranquila sentada y como buena predisposición	\N	2026-04-04 03:44:40.820289	1
71	3	Fausto	\N	Lic.Marquez	2026-04-09	trabajo bein pocas ganas	\N	\N	2026-04-09 01:50:39.750073	1
72	15	Mika Paz	\N	Lic.Marquez	2026-04-17	poco contacto visual y lavilidad	\N	\N	2026-04-17 01:46:58.270658	1
73	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-19	\N	\N	\N	2026-04-19 23:15:58.702855	1
74	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-19	\N	\N	\N	2026-04-19 23:20:40.162777	1
75	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-19	\N	\N	\N	2026-04-19 23:26:50.990851	1
76	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:14:21.749607	1
77	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:14:36.717161	1
78	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:14:55.360984	1
79	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:16:56.254787	1
80	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:18:04.079582	1
81	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:23:22.986217	1
82	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:24:15.366878	1
83	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:25:21.332715	1
84	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:33:32.61541	1
85	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:43:23.809765	1
86	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:43:53.181041	1
87	15	Mika Paz	\N	Lic.Marquez	2026-04-20	trabajo bien , se canso rapido	\N	\N	2026-04-20 00:51:37.543016	1
88	15	Mika Paz	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 00:52:14.301524	1
89	15	Mika Paz	\N	Lic.Marquez	2026-04-19	\N	\N	\N	2026-04-20 00:53:50.944644	1
90	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	Sesión de prueba de validación	\N	2026-04-20 17:24:17.025531	1
91	15	Mika Paz	\N	Lic.Marquez	2026-04-20	se canso rapido	\N	\N	2026-04-20 17:24:19.241906	1
92	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 17:25:54.417562	1
93	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 17:26:22.47666	1
94	1	Alvaro Gonzalez	\N	Lic.Marquez	2026-04-20	\N	\N	\N	2026-04-20 17:26:51.625147	1
95	15	Mika Paz	\N	Lic.Marquez	2026-04-20	bien	\N	\N	2026-04-20 17:30:15.013886	1
3	2	Álvaro Sampietro	\N	\N	2026-03-30	\N	Se cansa y trabajo lento cuando tiene q leer\nDispraxia, le cuesta repetir secuencia de fonemas de palabras q no conoce \nEj Aries 	\N	2026-03-30 21:34:34.442068	\N
4	3	fausto sampietro	\N	\N	2026-03-30	\N	Trabajamos organización de palabras dentro de la oración\nDándole espacio q cada palabra con el fin de organizar y tener en cuenta los espacios de cada palabras en la oración	\N	2026-03-30 22:30:04.196631	\N
5	4	lautaro farias	\N	\N	2026-03-31	\N	el niño Hoy pudo lograr trabajar tranquilo y hacerse el congelado	\N	2026-03-31 00:35:41.425571	\N
6	3	fausto sampietro	\N	\N	2026-04-06	Trabajamos con la compu \nComprensión lectora\nMucha ansiedad	\N	\N	2026-04-06 22:22:35.424432	\N
7	5	Helena	\N	\N	2026-04-15	\N	la paciente no le gusta mucho hacer actividades de repetició mejoró la repetición de palabras con L intermedia	\N	2026-04-15 20:53:06.163133	\N
8	7	Alvaro Sampietro	\N	\N	2026-04-19	El niño logró poco la consigna realizada\nSe continuará evaluando 	\N	\N	2026-04-19 22:01:31.580857	\N
9	7	Alvaro Sampietro	\N	\N	2026-04-19	El niño logró poco la consigna realizada\nSe continuará evaluando 	Hayan continuar trabjando	\N	2026-04-19 22:02:11.895655	\N
11	7	Alvaro Sampietro	\N	\N	2026-04-19	El niño logró poco la consigna realizada\nSe continuará evaluando 	Hayan continuar trabjando	\N	2026-04-19 22:03:15.936959	\N
12	7	Alvaro Sampietro	\N	\N	2026-04-19	\N	\N	\N	2026-04-19 22:14:10.648491	\N
13	7	Alvaro Sampietro	\N	jaqui	2026-04-21	\N	\N	\N	2026-04-21 13:13:53.492674	2
14	8	Helena	\N	jaqui	2026-04-22	Se realizó sesión con Helena, 4 años, en el contexto de trastorno de los sonidos del habla (TSH). El trabajo se centró en producción del habla, articulación y sonidos del habla. Se trabajó el objetivo "Discriminar auditivamente pares mínimos de fonemas" (abordaje inicial). Se trabajaron aspectos articulatorios con retroalimentación auditiva y visual para favorecer la corrección de los patrones alterados.	la niña trabajó bien se cansaba rápido	\N	2026-04-22 17:51:27.308066	2
15	8	Helena	\N	jaqui	2026-04-22	\N	\N	\N	2026-04-22 20:37:29.078537	2
16	11	Gonzalo Soler	\N	Lic. Natalia	2026-04-24	\N	\N	\N	2026-04-23 02:12:21.732195	5
18	12	Demo 1	\N	Administrador	2026-04-24	Trabajo bien	\N	\N	2026-04-24 12:54:20.279491	1
19	28	Lautaro	\N	Administrador	2026-04-27	Le cuesta terminar una consigna simple\nLe lleva mucho tiempo	\N	\N	2026-04-27 20:22:49.402598	1
20	29	Alvaro	\N	Administrador	2026-04-27	Le cuesta separar en sílabas\nY cuando la silaba esta \n\nSilaba aislada de 2 \nReconoce\n\nErrores de conjugación en la escritura\n\nNo registra espacios\n\nEn la test, estructura de oraciones estaba complicado\n\nConfunde d por b\n\nNunca le cuenta \nProblemas con el futuro\n\nT	Trabajamos nombres de letras difrentende sonidos \nContinuar con eso	\N	2026-04-27 21:31:20.293892	1
21	30	Fusto	\N	Administrador	2026-04-27	Trabajamos seguir indicaciones, muy lento\nCuando habla se va por las ramas \nNo tiene mucha coherencia algunas cosas \nHabla sin registrar al interlocutor\n\nCuando tiene q hacer alguna actividad de pasos y organizacion demora mucho tiempo\nSe concentra pero va muy lento \n	\N	\N	2026-04-27 22:34:25.372112	1
\.


--
-- TOC entry 3551 (class 0 OID 24599)
-- Dependencies: 220
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, patient_id, professional_id, date, duration, type, notes, status, created_at) FROM stdin;
\.


--
-- TOC entry 3567 (class 0 OID 40961)
-- Dependencies: 236
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, role, professional_id, name, created_at, specialty, active) FROM stdin;
2	maria@neurometric.cl	$2b$10$v5H2v9liSpI2XD6d/VPdZeSDqVTuALU/3UcIaaq0huOqo1rRloFim	professional	\N	Dra. María López Soto	2026-04-15 03:00:31.228152	Fonoaudiología	t
3	mili@gmail.com	$2b$10$cW9WzIDuQKhg2G6WX98KIeMvNIzrnSVLk9xsg5H3gK5GzvowiIeNe	professional	\N	Mili	2026-04-22 20:33:38.687838	Fonoaudiología	t
4	mica@gmail.com	$2b$10$mwH.1B4GBgU/HNPLrpAVtek2xADMRbf3LimidqBGCWPyHNqjZW2s.	professional	\N	Mica	2026-04-22 20:34:56.391879	Fonoaudiología	t
5	nataliaruthfarias1988@gmail.com	$2b$10$ySaHM3i8G2ERDU57qGml..1o9U1iR5XFMVV3VgkDekO1uDcEyalna	professional	\N	Fga Natalia Farias	2026-04-23 00:36:01.603237	Fonoaudiología	t
1	admin@neurometric.cl	$2b$10$4kcr6gNCM13ZNOvent2.lOkZUkEIZgwa.K9VsqQZN2OAt75LnDg6W	professional	\N	Administrador	2026-03-28 19:39:14.763539	\N	t
6	guada@gmail.com	$2b$10$9SgKdKJDwsKYfLXruq2/uutfu2KMmHNDMPGeU1ci4.25dNnWlkhXW	professional	\N	Guada	2026-04-24 13:57:57.863167	Fonoaudiología	t
7	galvanbraian92@gmail.com	$2b$10$Wp/wPrSJW2xCzQ53ojgSueyZo4FwbYR.ioNXgkvtYem6hTwcNHrya	professional	\N	Braian Galvan	2026-04-25 18:06:49.25354	Fonoaudiología	t
8	jaquimarque6@gmail.com	$2b$10$Yj6F1A3RkKQZwHxLlTnY3uYUjSTNL/EpuDbr8kPuqFSxvgnp1s5aG	admin	\N	Jaqui	2026-05-02 15:00:58.969403	\N	t
9	admin@neurometric.com	$2b$10$q2PqMm9mDKY7rw33xdageO44vz07.MNp9pJY.W4lt1o2Iit1sxN8K	admin	\N	Admin	2026-05-02 15:29:46.593681	\N	t
\.


--
-- TOC entry 3591 (class 0 OID 0)
-- Dependencies: 231
-- Name: actividades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actividades_id_seq', 75, true);


--
-- TOC entry 3592 (class 0 OID 0)
-- Dependencies: 237
-- Name: citas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.citas_id_seq', 534, true);


--
-- TOC entry 3593 (class 0 OID 0)
-- Dependencies: 223
-- Name: goal_library_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goal_library_id_seq', 531, true);


--
-- TOC entry 3594 (class 0 OID 0)
-- Dependencies: 233
-- Name: goal_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goal_progress_id_seq', 188, true);


--
-- TOC entry 3595 (class 0 OID 0)
-- Dependencies: 221
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goals_id_seq', 54, true);


--
-- TOC entry 3596 (class 0 OID 0)
-- Dependencies: 240
-- Name: pagos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pagos_id_seq', 9, true);


--
-- TOC entry 3597 (class 0 OID 0)
-- Dependencies: 229
-- Name: patient_professionals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_professionals_id_seq', 6, true);


--
-- TOC entry 3598 (class 0 OID 0)
-- Dependencies: 215
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patients_id_seq', 30, true);


--
-- TOC entry 3599 (class 0 OID 0)
-- Dependencies: 217
-- Name: professionals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.professionals_id_seq', 3, true);


--
-- TOC entry 3600 (class 0 OID 0)
-- Dependencies: 227
-- Name: registros_clinicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.registros_clinicos_id_seq', 102, true);


--
-- TOC entry 3601 (class 0 OID 0)
-- Dependencies: 225
-- Name: registros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.registros_id_seq', 10, true);


--
-- TOC entry 3602 (class 0 OID 0)
-- Dependencies: 219
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, true);


--
-- TOC entry 3603 (class 0 OID 0)
-- Dependencies: 235
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- TOC entry 3390 (class 2606 OID 32796)
-- Name: actividades actividades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades
    ADD CONSTRAINT actividades_pkey PRIMARY KEY (id);


--
-- TOC entry 3398 (class 2606 OID 57356)
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id);


--
-- TOC entry 3380 (class 2606 OID 24631)
-- Name: goal_library goal_library_id_objetivo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_library
    ADD CONSTRAINT goal_library_id_objetivo_unique UNIQUE (id_objetivo);


--
-- TOC entry 3382 (class 2606 OID 24629)
-- Name: goal_library goal_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_library
    ADD CONSTRAINT goal_library_pkey PRIMARY KEY (id);


--
-- TOC entry 3392 (class 2606 OID 32809)
-- Name: goal_progress goal_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_progress
    ADD CONSTRAINT goal_progress_pkey PRIMARY KEY (id);


--
-- TOC entry 3378 (class 2606 OID 24619)
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- TOC entry 3402 (class 2606 OID 98316)
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- TOC entry 3388 (class 2606 OID 32785)
-- Name: patient_professionals patient_professionals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_professionals
    ADD CONSTRAINT patient_professionals_pkey PRIMARY KEY (id);


--
-- TOC entry 3372 (class 2606 OID 24585)
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- TOC entry 3374 (class 2606 OID 24597)
-- Name: professionals professionals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.professionals
    ADD CONSTRAINT professionals_pkey PRIMARY KEY (id);


--
-- TOC entry 3386 (class 2606 OID 32777)
-- Name: registros_clinicos registros_clinicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_clinicos
    ADD CONSTRAINT registros_clinicos_pkey PRIMARY KEY (id);


--
-- TOC entry 3384 (class 2606 OID 24641)
-- Name: registros registros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros
    ADD CONSTRAINT registros_pkey PRIMARY KEY (id);


--
-- TOC entry 3400 (class 2606 OID 73734)
-- Name: express_sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.express_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3376 (class 2606 OID 24608)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3394 (class 2606 OID 40972)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 3396 (class 2606 OID 40970)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


-- Completed on 2026-05-03 16:13:40 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict T6ECCcPlZQmFsbZbdBlIG9UC3VXCWdBVrk1qh5SSzQLWbDqgbfQDJs5oW2sD6hL

