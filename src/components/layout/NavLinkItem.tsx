import { NavLink, type NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkItemProps extends Omit<NavLinkProps, "className" | "children"> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export default function NavLinkItem({
  children,
  icon,
  className,
  ...props
}: NavLinkItemProps) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        cn(
          "relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200",
          "text-primary-600 hover:text-primary-800",
          "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-accent-500 after:to-primary-500 after:transition-all after:duration-300",
          isActive &&
            "text-primary-800 after:w-4/5",
          className
        )
      }
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </NavLink>
  );
}
