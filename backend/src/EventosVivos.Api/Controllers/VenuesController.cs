using EventosVivos.Application.DTOs;
using EventosVivos.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventosVivos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VenuesController : ControllerBase
{
    private readonly IVenueService _venueService;

    public VenuesController(IVenueService venueService)
    {
        _venueService = venueService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VenueResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var result = await _venueService.GetAllAsync(cancellationToken);
        return Ok(result);
    }
}
