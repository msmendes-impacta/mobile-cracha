/** Routes shown while signed out. `firstUser` exists only while no user has been created. */
export type PublicStackParamList = {
  login: undefined;
  firstUser: undefined;
};

/** Routes shown while signed in. Params carry ids only, never credentials (FR-030). */
export type PrivateStackParamList = {
  users: undefined;
  userForm: { id?: string } | undefined;
};
