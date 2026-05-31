import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../http-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest.fn().mockReturnValue({ url: '/test' });
const mockSwitchToHttp = jest.fn().mockReturnValue({
  getResponse: mockGetResponse,
  getRequest: mockGetRequest,
});

function buildHost(type = 'http'): ArgumentsHost {
  return {
    getType: () => type,
    switchToHttp: mockSwitchToHttp,
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
    mockStatus.mockReturnValue({ json: mockJson });
  });

  it('returns the HttpException status and response body', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
    filter.catch(exception, buildHost());

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = mockJson.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(body.path).toBe('/test');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 500 for unexpected errors', () => {
    filter.catch(new Error('boom'), buildHost());

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = mockJson.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('spreads object HttpException responses into the body', () => {
    const exception = new HttpException(
      { message: 'Validation failed', errors: ['field required'] },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, buildHost());

    const body = mockJson.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toBe('Validation failed');
    expect(body.errors).toEqual(['field required']);
  });

  it('does nothing for non-http contexts (e.g. ws)', () => {
    filter.catch(new Error('ws error'), buildHost('ws'));
    expect(mockStatus).not.toHaveBeenCalled();
  });
});
