--
-- PostgreSQL database dump
--

\restrict FMU2feqHd2YliHWcZWGfqamvfVfpefhGxRTf1YDx8xiyfhdKJpQ4OOJBHTwxcjx

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    message text NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'PENDING'::character varying
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: disaster_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disaster_events (
    id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    start_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.disaster_events OWNER TO postgres;

--
-- Name: disaster_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disaster_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.disaster_events_id_seq OWNER TO postgres;

--
-- Name: disaster_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disaster_events_id_seq OWNED BY public.disaster_events.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(15) NOT NULL,
    address text NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_risk character varying(20) DEFAULT 'LOW'::character varying,
    last_rain_risk character varying(20) DEFAULT 'LOW'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: weather_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weather_data (
    id integer NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    temperature numeric(5,2),
    humidity numeric(5,2),
    rainfall numeric(8,2),
    wind_speed numeric(6,2),
    recorded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.weather_data OWNER TO postgres;

--
-- Name: weather_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.weather_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weather_data_id_seq OWNER TO postgres;

--
-- Name: weather_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.weather_data_id_seq OWNED BY public.weather_data.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: disaster_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disaster_events ALTER COLUMN id SET DEFAULT nextval('public.disaster_events_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: weather_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weather_data ALTER COLUMN id SET DEFAULT nextval('public.weather_data_id_seq'::regclass);


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, user_id, alert_type, severity, message, sent_at, status) FROM stdin;
2	1	Heatwave	HIGH	HIGH heatwave risk detected in your area. Stay hydrated and avoid direct sunlight.	2026-10-01 22:46:12.787949	SENT
3	7	Heatwave	HIGH	HIGH heatwave risk detected in your area. Stay hydrated and avoid direct sunlight.	2026-10-02 20:10:25.413872	PENDING
1	1	Heatwave	HIGH	High heatwave risk detected in your area. Stay hydrated and avoid direct sunlight.	2026-09-04 20:18:54.814757	FAILED
4	1	Heatwave	HIGH	HIGH heatwave risk detected in your area. Stay hydrated and avoid direct sunlight.	2026-10-03 15:48:21.643728	SENT
5	1	Heatwave	HIGH	HIGH heatwave risk detected in your area. Stay hydrated and avoid direct sunlight.	2026-10-03 15:48:40.441296	SENT
6	9	Heatwave	HIGH	HIGH heatwave risk detected in your area. Stay hydrated and avoid direct sunlight.	2026-10-03 22:25:16.982104	SENT
7	9	Heavy Rain	HIGH	HIGH heavy rain risk detected in your area. Avoid flooded areas and stay indoors if possible.	2026-10-03 23:27:21.190589	SENT
\.


--
-- Data for Name: disaster_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disaster_events (id, event_type, severity, latitude, longitude, start_time) FROM stdin;
1	Heatwave	HIGH	30.3165000	78.0322000	2026-09-04 20:12:16.450098
2	Heatwave	LOW	28.9800200	77.7063600	2026-10-01 22:04:40.713931
3	Heatwave	LOW	30.3165000	78.0322000	2026-10-01 22:34:38.809694
4	Heatwave	LOW	21.7051000	72.9959000	2026-10-01 22:39:53.254496
5	Heatwave	LOW	21.0600000	72.6300000	2026-10-01 22:43:03.103258
6	Heatwave	MODERATE	30.3165000	78.0322000	2026-10-01 22:44:49.57713
7	Heatwave	HIGH	30.3165000	78.0322000	2026-10-01 22:46:12.819191
8	Heatwave	LOW	30.3165000	78.0322000	2026-10-01 23:46:56.849026
9	Heatwave	MODERATE	28.4696000	77.4957000	2026-10-07 15:20:46.793058
10	Heatwave	MODERATE	28.4696000	77.4957000	2026-10-07 15:20:46.793058
11	Heatwave	MODERATE	28.4696000	77.4957000	2026-10-07 15:20:46.793058
12	Heatwave	MODERATE	28.4697000	77.4957000	2026-10-07 15:43:46.734956
13	Heatwave	LOW	28.4697000	77.4957000	2026-10-07 17:53:44.526012
14	Heatwave	LOW	28.4744000	77.5040000	2026-10-11 01:13:39.007934
15	Heatwave	LOW	28.4696000	77.4957000	2026-10-11 02:01:24.416592
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, phone, address, latitude, longitude, created_at, last_risk, last_rain_risk) FROM stdin;
2	Aman	0987654321	UP	\N	\N	2026-09-13 01:50:34.659957	LOW	LOW
5	Aman	123456789	UP	\N	\N	2026-09-13 01:54:24.873267	LOW	LOW
7	Aman	9876543210	Dehradun, Uttarakhand	30.3165000	78.0322000	2026-09-13 01:59:25.7905	LOW	LOW
8	Abhi	798823456	Meerut , Uttar Pradesh , India	29.0018557	77.7679671	2026-09-14 00:19:57.901751	LOW	LOW
1	Test User	9999999999	Dehradun, Uttarakhand	30.3165000	78.0322000	2026-09-04 19:57:46.603565	LOW	LOW
9	SMS Test User	7983327658	Dehradun, Uttarakhand, India	30.3165000	78.0322000	2026-10-03 22:23:29.142079	LOW	HIGH
13	Aman Choudhary	8800235170	Greater Noida, Uttar Pradesh, India	28.4670734	77.5137649	2026-10-07 15:59:59.494542	LOW	LOW
14	aman	1234567890-	Greater Noida, Uttar Pradesh, India	28.4670734	77.5137649	2026-10-07 16:01:16.356822	LOW	LOW
15	aman	8218820434	Greater Noida, Uttar Pradesh, India	28.4670734	77.5137649	2026-10-07 16:02:46.578092	LOW	LOW
18	aman	4568723655	Greater Noida, Uttar Pradesh, India	28.4670734	77.5137649	2026-10-11 01:13:19.532388	LOW	LOW
\.


--
-- Data for Name: weather_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weather_data (id, latitude, longitude, temperature, humidity, rainfall, wind_speed, recorded_at) FROM stdin;
1	30.3165000	78.0322000	42.00	35.00	0.00	18.00	2026-09-04 20:04:38.447923
2	28.9800200	77.7063600	25.70	78.00	0.00	9.70	2026-10-01 21:32:15.442846
3	28.9800200	77.7063600	25.60	78.00	0.00	9.60	2026-10-01 21:50:40.957877
4	28.9800200	77.7063600	25.50	78.00	0.00	9.60	2026-10-01 22:04:40.713931
5	30.3165000	78.0322000	21.30	95.00	0.00	5.60	2026-10-01 22:34:38.809694
6	21.7051000	72.9959000	28.50	63.00	0.00	5.20	2026-10-01 22:39:53.254496
7	21.0600000	72.6300000	27.60	72.00	0.00	5.60	2026-10-01 22:43:03.103258
8	30.3165000	78.0322000	21.30	95.00	0.00	5.60	2026-10-01 22:44:49.57713
9	30.3165000	78.0322000	21.20	94.00	0.00	5.30	2026-10-01 22:46:12.819191
10	30.3165000	78.0322000	20.70	92.00	0.00	3.60	2026-10-01 23:46:56.849026
11	28.4696000	77.4957000	32.10	54.00	0.00	4.00	2026-10-07 15:20:46.793058
12	28.4696000	77.4957000	32.10	54.00	0.00	4.00	2026-10-07 15:20:46.793058
13	28.4696000	77.4957000	32.10	54.00	0.00	4.00	2026-10-07 15:20:46.793058
14	28.4696000	77.4957000	32.10	54.00	0.00	4.00	2026-10-07 15:20:49.936487
15	28.4696000	77.4957000	32.10	54.00	0.00	4.00	2026-10-07 15:21:00.449928
16	28.4696000	77.4957000	32.10	54.00	0.00	4.40	2026-10-07 15:23:26.060348
17	28.4697000	77.4957000	32.10	54.00	0.00	4.40	2026-10-07 15:43:46.734956
18	28.4697000	77.4957000	32.00	54.00	0.00	5.10	2026-10-07 15:45:46.920431
19	28.4697000	77.4957000	32.00	54.00	0.00	5.10	2026-10-07 15:57:40.815421
20	28.4696000	77.4957000	32.00	54.00	0.00	6.00	2026-10-07 16:00:03.464532
21	28.4696000	77.4957000	32.00	54.00	0.00	6.00	2026-10-07 16:01:19.040131
22	28.4696000	77.4957000	32.00	54.00	0.00	6.00	2026-10-07 16:02:49.74236
23	28.4696000	77.4957000	31.40	57.00	0.00	8.00	2026-10-07 16:48:10.608473
24	28.4697000	77.4957000	28.90	72.00	0.00	3.80	2026-10-07 17:53:44.526012
25	28.4697000	77.4957000	28.40	75.00	0.00	5.20	2026-10-07 18:01:11.222269
26	28.4697000	77.4957000	28.40	75.00	0.00	5.20	2026-10-07 18:01:23.131313
27	28.4697000	77.4957000	28.40	75.00	0.00	5.20	2026-10-07 18:01:43.189041
28	28.4697000	77.4957000	28.40	75.00	0.00	5.20	2026-10-07 18:06:31.799572
29	28.4697000	77.4957000	28.40	75.00	0.00	5.20	2026-10-07 18:09:29.857814
30	28.4697000	77.4957000	27.40	78.00	0.00	8.20	2026-10-07 18:17:06.226601
31	28.4697000	77.4957000	26.50	81.00	0.00	11.40	2026-10-07 19:46:20.078984
32	28.4697000	77.4957000	26.50	81.00	0.00	11.40	2026-10-07 19:56:57.101802
33	28.4697000	77.4957000	26.40	81.00	0.00	11.00	2026-10-07 20:15:26.407431
34	28.4697000	77.4957000	26.40	81.00	0.00	11.00	2026-10-07 20:29:42.765298
35	28.4697000	77.4957000	23.90	84.00	0.00	13.30	2026-10-07 22:25:46.619024
36	30.3165000	78.0322000	18.10	91.00	0.00	2.60	2026-10-11 00:44:14.282736
37	28.4697000	77.4957000	23.30	87.00	0.00	10.30	2026-10-11 01:13:20.477181
38	28.4744000	77.5040000	23.30	87.00	0.00	10.70	2026-10-11 01:13:39.007934
39	28.4697000	77.4957000	23.10	88.00	0.00	11.40	2026-10-11 01:53:51.182876
40	28.4697000	77.4957000	23.10	88.00	0.00	11.40	2026-10-11 01:58:09.148673
41	28.4696000	77.4957000	23.00	89.00	0.00	11.80	2026-10-11 02:01:24.416592
42	28.4696000	77.4957000	22.90	89.00	0.00	12.00	2026-10-11 02:06:02.681024
43	28.4697000	77.4957000	22.90	89.00	0.00	12.00	2026-10-11 02:18:46.651156
\.


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_id_seq', 7, true);


--
-- Name: disaster_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.disaster_events_id_seq', 15, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 18, true);


--
-- Name: weather_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weather_data_id_seq', 43, true);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: disaster_events disaster_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disaster_events
    ADD CONSTRAINT disaster_events_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weather_data weather_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weather_data
    ADD CONSTRAINT weather_data_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FMU2feqHd2YliHWcZWGfqamvfVfpefhGxRTf1YDx8xiyfhdKJpQ4OOJBHTwxcjx

