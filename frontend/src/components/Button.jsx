export default function Button({ children, type = "button", onClick, className = "" }) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`text-primary border border-primary bg-transparent hover:text-white hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center transition duration-200 ${className}`}
      >
        {children}
      </button>
    );
  }
  