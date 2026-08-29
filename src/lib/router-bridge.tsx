"use client";

import React from "react";
import NextLink from "next/link";
import { useRouter as useNextRouter, usePathname as useNextPathname, useParams as useNextParams } from "next/navigation";

export function Link({ to, href, children, className, ...props }: any) {
  const target = href || to || "#";
  return (
    <NextLink href={target} className={className} {...props}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, children, ...props }: any) {
  const pathname = useNextPathname();
  const target = href || to || "#";
  const isActive = pathname === target || (target !== "/" && pathname?.startsWith(target));
  const computedClassName = typeof className === "function" ? className({ isActive }) : className;

  return (
    <NextLink href={target} className={computedClassName} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  try {
    const router = useNextRouter();
    return (path: string) => {
      if (router) {
        router.push(path);
      } else if (typeof window !== "undefined") {
        window.location.href = path;
      }
    };
  } catch {
    return (path: string) => {
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    };
  }
}

export function useLocation() {
  try {
    const pathname = useNextPathname();
    return { pathname: pathname || "/" };
  } catch {
    return { pathname: typeof window !== "undefined" ? window.location.pathname : "/" };
  }
}

export function useParams() {
  try {
    const params = useNextParams();
    return params || {};
  } catch {
    return {};
  }
}

export function useSearchParams() {
  const getParam = (key: string) => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(key);
    }
    return null;
  };
  return [{ get: getParam }];
}
