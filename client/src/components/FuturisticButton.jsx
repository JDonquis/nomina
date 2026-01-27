export default function FuturisticButton({ children, onClick }) {
  return (
    <button type="button" className="button" onClick={onClick}>
      {children}
    </button>
  );
}
