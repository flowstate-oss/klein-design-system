"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar.js";
import { cn, getInitials, getUserAvatarColor } from "./utils.js";

interface UserAvatarProps extends React.ComponentPropsWithoutRef<
  typeof Avatar
> {
  name: string;
  avatarUrl?: string | null;
  /**
   * Optional custom initials. If not provided, will be derived from `name`.
   */
  initials?: string;
}

/**
 * Standardized User Avatar component.
 *
 * - Renders an image if `avatarUrl` is provided.
 * - Falls back to a colored circle with initials derived from `name`.
 * - The background color is deterministically generated from the `name` using chart colors.
 */
export function UserAvatar({
  name,
  avatarUrl,
  initials,
  className,
  ...props
}: UserAvatarProps) {
  const finalInitials = initials || getInitials(name);
  const backgroundColor = getUserAvatarColor(name);

  return (
    <Avatar className={cn("h-8 w-8", className)} {...props}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback
        className="text-xs font-medium text-white"
        style={{ backgroundColor }}
      >
        {finalInitials}
      </AvatarFallback>
    </Avatar>
  );
}
