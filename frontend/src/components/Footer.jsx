/**
 * `Footer` Komponente für die Fußzeile der Anwendung.
 * Zeigt typische Informationen wie Copyright an.
 */
export default function Footer() {
  return (
    <footer className="bg-secondary border-t mt-8 text-center text-sm text-base text-gray-600 py-4">
      © {new Date().getFullYear()} Holtkamp Consulting – Mitarbeiterportal
    </footer>
  );
}
