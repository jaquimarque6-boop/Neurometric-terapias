export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Panel principal</h1>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={() => (window.location.href = "/patients")}>
          Ver pacientes
        </button>

        <button onClick={() => (window.location.href = "/patients")}>
          Registrar sesión
        </button>

        <button onClick={() => (window.location.href = "/patients")}>
          Informes
        </button>
      </div>
    </div>
  );
}
