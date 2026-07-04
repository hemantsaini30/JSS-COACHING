const Sidebar = ({ items, activePath }) => {
  return (
    <nav className="flex flex-col gap-1 py-4">
      {items.map((item) => (
        
          key={item.path}
          href={item.path}
          className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
            activePath === item.path
              ? 'bg-blue-900 text-white border-l-2 border-emerald-400'
              : 'text-blue-200 hover:bg-blue-900 hover:text-white'
          }`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export default Sidebar