import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export function PublicRoute({ children }: Props) {
  const storedCurrentUser = JSON.parse((localStorage.getItem('currentUser')) || ('null'));

  if (storedCurrentUser) {
    return <Navigate to="/matches" replace/>;
  }

  return children;
}

export function PrivateRoute({ children }: Props) {
  const storedCurrentUser = JSON.parse((localStorage.getItem('currentUser')) || ('null'));

  if (!storedCurrentUser) {
    return <Navigate to="/login" replace/>;
  }

  return children;
}