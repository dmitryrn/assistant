import { Redirect } from 'expo-router';
import React from 'react';

export default function IndexRoute(): React.JSX.Element {
  return <Redirect href="/main" />;
}
