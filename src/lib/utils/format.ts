export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function shortenHash(hash?: string, chars = 6): string {
  if (!hash) return "";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`;
}

export function formatDate(dateString?: string | number): string {
  if (!dateString) return "N/A";
  const date = typeof dateString === "number" ? new Date(dateString * 1000) : new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function getScoreColor(score: number): {
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  glowColor: string;
} {
  if (score >= 90) {
    return {
      badgeBg: "bg-emerald-500/10",
      badgeBorder: "border-emerald-500/30",
      textColor: "text-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.4)",
    };
  }
  if (score >= 80) {
    return {
      badgeBg: "bg-cyan-500/10",
      badgeBorder: "border-cyan-500/30",
      textColor: "text-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.4)",
    };
  }
  if (score >= 70) {
    return {
      badgeBg: "bg-indigo-500/10",
      badgeBorder: "border-indigo-500/30",
      textColor: "text-indigo-400",
      glowColor: "rgba(99, 102, 241, 0.4)",
    };
  }
  return {
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    textColor: "text-amber-400",
    glowColor: "rgba(245, 158, 11, 0.4)",
  };
}
