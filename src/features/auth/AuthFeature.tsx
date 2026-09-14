"use client";

import React from "react";
import { AuthModal, AuthModalProps } from "./AuthModal";

export interface AuthFeatureProps extends AuthModalProps {}

export const AuthFeature: React.FC<AuthFeatureProps> = (props) => {
  return <AuthModal {...props} />;
};

export { AuthModal };
