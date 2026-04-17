function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-6 px-8 py-6 rounded-[2rem] cursor-pointer transition-all border ${active ? 'bg-[linear-gradient(90deg,#d7fbff,#7dd3fc)] text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.34)] border-cyan-200/40 scale-[1.01]' : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-white'}`}
    >
      {icon}
      <span className={`text-[11px] uppercase tracking-[0.2em] ${active ? 'font-black' : 'font-bold'}`}>
        {label}
      </span>
    </div>
  );
}

export default NavItem;
