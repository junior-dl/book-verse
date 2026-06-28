export class ProviderError extends Error {}
export class ProviderUnavailableError extends ProviderError {}
export class BookNotFoundError extends ProviderError {}
export class AuthorNotFoundError extends ProviderError {}
export class WorkNotFoundError extends ProviderError {}
