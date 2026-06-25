using EventosVivos.Application.Constants;
using EventosVivos.Application.DTOs;
using EventosVivos.Application.Interfaces;
using EventosVivos.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventosVivos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [Authorize(Roles = $"{AuthRoles.User},{AuthRoles.Admin}")]
    [HttpPost]
    public async Task<ActionResult<ReservationResponse>> Create(
        [FromBody] CreateReservationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _reservationService.CreateAsync(request, User.GetUserId(), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<ReservationResponse>>> GetMyReservations(
        CancellationToken cancellationToken)
    {
        var result = await _reservationService.GetMyReservationsAsync(User.GetUserId(), cancellationToken);
        return Ok(result);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReservationResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _reservationService.GetByIdAsync(id, User.GetUserId(), User.IsAdmin(), cancellationToken);
        return Ok(result);
    }

    [Authorize(Roles = AuthRoles.Admin)]
    [HttpPost("{id:guid}/confirm-payment")]
    public async Task<ActionResult<ReservationResponse>> ConfirmPayment(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _reservationService.ConfirmPaymentAsync(id, cancellationToken);
        return Ok(result);
    }

    [Authorize(Roles = $"{AuthRoles.User},{AuthRoles.Admin}")]
    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult<ReservationResponse>> Pay(Guid id, CancellationToken cancellationToken)
    {
        var result = await _reservationService.PayAsync(id, User.GetUserId(), User.IsAdmin(), cancellationToken);
        return Ok(result);
    }

    [Authorize(Roles = $"{AuthRoles.User},{AuthRoles.Admin}")]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ReservationResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _reservationService.CancelAsync(id, User.GetUserId(), User.IsAdmin(), cancellationToken);
        return Ok(result);
    }
}
