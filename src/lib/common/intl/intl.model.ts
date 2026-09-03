export type Substitution = bigint | boolean | number | string;

export type Substitutions =
  | []
  | [Substitution]
  | [Substitution, Substitution]
  | [Substitution, Substitution, Substitution]
  | [Substitution, Substitution, Substitution, Substitution]
  | [Substitution, Substitution, Substitution, Substitution, Substitution]
  | [Substitution, Substitution, Substitution, Substitution, Substitution, Substitution]
  | [Substitution, Substitution, Substitution, Substitution, Substitution, Substitution, Substitution]
  | [Substitution, Substitution, Substitution, Substitution, Substitution, Substitution, Substitution, Substitution]
  | [
      Substitution,
      Substitution,
      Substitution,
      Substitution,
      Substitution,
      Substitution,
      Substitution,
      Substitution,
      Substitution,
    ];
