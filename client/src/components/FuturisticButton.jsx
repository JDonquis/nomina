export default function FuturisticButton({ children, onClick, classess, type = "button" }) {
  return (
    <button type={type} className={`button ${classess}`} onClick={onClick}>
      {children}
    </button>
  );
}
