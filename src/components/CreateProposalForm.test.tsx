import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CreateProposalForm from './CreateProposalForm';

const renderForm = (onSubmit = vi.fn().mockResolvedValue(undefined)) => {
    render(<CreateProposalForm firstHour={7} lastHour={17} participantId={42} scheduleDayId={8} onCancel={vi.fn()} onSubmit={onSubmit} />);
    return onSubmit;
};

afterEach(cleanup);

describe('CreateProposalForm', () => {
    it('wysyła jednogodzinną służbę z równymi godzinami API', async () => {
        const onSubmit = renderForm();
        await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
        expect(onSubmit).toHaveBeenCalledWith({ participantId: 42, scheduleDayId: 8, hourStart: 7, hourEnd: 7, serviceLengthStart: 1, serviceLengthEnd: 1, breakMode: 0, pairParticipantId: null, alternativeGroup: null });
    });

    it('ogranicza godzinę DO do wartości późniejszych niż OD', async () => {
        renderForm();
        await userEvent.selectOptions(screen.getByLabelText('Służba od'), '14');
        const end = screen.getByLabelText('Służba do') as HTMLSelectElement;
        expect(end.value).toBe('15');
        expect(Array.from(end.options).map(option => option.value)).toEqual(['15', '16', '17', '18']);
    });

    it('udostępnia przerwę tylko gdy mieści się obok minimalnej służby', async () => {
        renderForm();
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '10');
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '3');
        await userEvent.click(screen.getByLabelText('Z przerwą'));
        expect(screen.getByLabelText('Długość przerwy od')).toBeInTheDocument();
        expect(Array.from((screen.getByLabelText('Długość przerwy do') as HTMLSelectElement).options).map(o => o.value)).toEqual(['1']);
        await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '1');
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
    });

    it('wysyła oba pola przerwy razem', async () => {
        const onSubmit = renderForm();
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '11');
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '3');
        await userEvent.click(screen.getByLabelText('Z przerwą'));
        await userEvent.selectOptions(screen.getByLabelText('Długość przerwy do'), '2');
        await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ hourEnd: 10, breakMode: 1, breakLengthStart: 1, breakLengthEnd: 2 }));
    });
});

describe('wybór pary i trybu przerwy', () => {
    it('ukrywa wyb?r pary bez uprawnienia', () => {
        renderForm();
        expect(screen.queryByLabelText('Uczestnik do pary')).not.toBeInTheDocument();
    });
    it('wysyła wybranego uczestnika i null dla opcji Obojętnie', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<CreateProposalForm firstHour={7} lastHour={17} participantId={42} scheduleDayId={8} allowPairSelection participants={[{id: 42, name: 'Anna'}, {id: 43, name: 'Jan'}]} onCancel={vi.fn()} onSubmit={onSubmit} />);
        expect(screen.getByLabelText('Uczestnik do pary')).toHaveValue('');
        expect(Array.from((screen.getByLabelText('Uczestnik do pary') as HTMLSelectElement).options).map(option => option.value)).toEqual(['', '43']);
        expect(screen.queryByRole('option', {name: 'Anna'})).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Uczestnik do pary'), '43');
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({pairParticipantId: 43}));
        await userEvent.selectOptions(screen.getByLabelText('Uczestnik do pary'), '');
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({pairParticipantId: null}));
    });
    it('wysyła opcjonalną przerwę i pomija długości po wyłączeniu przerwy', async () => {
        const onSubmit = renderForm();
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '10');
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '3');
        await userEvent.click(screen.getByRole('radio', {name: 'Obojętnie'}));
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({breakMode: 2, breakLengthStart: 1, breakLengthEnd: 1}));
        await userEvent.click(screen.getByRole('radio', {name: 'Bez przerwy'}));
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        const request = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
        expect(request.breakMode).toBe(0);
        expect(request).not.toHaveProperty('breakLengthStart');
        expect(request).not.toHaveProperty('breakLengthEnd');
    });
    it('resetuje tryb i długości wysyłki gdy skrócony czas nie pozwala na przerwę', async () => {
        const onSubmit = renderForm();
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '10');
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '3');
        await userEvent.click(screen.getByRole('radio', {name: 'Obojętnie'}));
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '8');
        expect(screen.queryByRole('group', { name: 'Przerwa' })).not.toBeInTheDocument();
        expect(screen.queryByRole('radio')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({breakMode: 0}));
        expect(onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0]).not.toHaveProperty('breakLengthStart');
    });
});

it('allows long breaks in a wide time window and normalizes changed limits', async () => {
    const onSubmit = renderForm();
    await userEvent.selectOptions(screen.getByLabelText('Służba do'), '18');
    expect(screen.queryByRole('group', {name: 'Przerwa'})).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '2');
    await userEvent.click(screen.getByRole('radio', {name: 'Z przerwą'}));
    expect(Array.from((screen.getByLabelText('Długość przerwy do') as HTMLSelectElement).options).map(o => o.value)).toEqual(['1','2','3','4','5','6','7','8','9']);
    await userEvent.selectOptions(screen.getByLabelText('Długość przerwy od'), '4');
    await userEvent.selectOptions(screen.getByLabelText('Długość przerwy do'), '9');
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({breakMode: 1, breakLengthStart: 4, breakLengthEnd: 9}));
    await userEvent.selectOptions(screen.getByLabelText('Służba do'), '10');
    expect(screen.getByLabelText('Długość przerwy od')).toHaveValue('1');
    expect(screen.getByLabelText('Długość przerwy do')).toHaveValue('1');
    await userEvent.selectOptions(screen.getByLabelText('Długość służby od'), '2');
    expect(screen.getByLabelText('Długość przerwy od')).toHaveValue('1');
    expect(screen.getByLabelText('Długość przerwy do')).toHaveValue('1');
    await userEvent.selectOptions(screen.getByLabelText('Długość służby od'), '1');
    await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '1');
    expect(screen.queryByRole('group', {name: 'Przerwa'})).not.toBeInTheDocument();
    expect(screen.queryByRole('group', {name: 'Długość przerwy'})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    const request = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
    expect(request.breakMode).toBe(0);
    expect(request).not.toHaveProperty('breakLengthStart');
    expect(request).not.toHaveProperty('breakLengthEnd');
    await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '2');
    expect(screen.getByRole('radio', {name: 'Bez przerwy'})).toBeChecked();
});


describe('alternative groups and overlapping proposals', () => {
    const setupGroup = (allow = true) => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<CreateProposalForm firstHour={7} lastHour={18} participantId={42} scheduleDayId={8}
            allowAlternativeGroupSelection={allow} proposals={[{hourStart: 14, hourEnd: 17, alternativeGroup: 'A'}]}
            groupUsage={[{dayName: 'Poniedziałek', alternativeGroup: 'A'}, {dayName: 'Środa', alternativeGroup: 'A'}]}
            onCancel={vi.fn()} onSubmit={onSubmit} />);
        return onSubmit;
    };
    it('shows usage and sends a trimmed group, or null for whitespace', async () => {
        const submit = setupGroup();
        const input = screen.getByLabelText('Grupa propozycji');
        expect(input).toHaveAttribute('maxlength', '16');
        await userEvent.type(input, ' A ');
        expect(screen.getByRole('status')).toHaveTextContent('Poniedziałek, Środa');
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({alternativeGroup: 'A'}));
        await userEvent.clear(input);
        await userEvent.type(input, 'B');
        expect(screen.getByRole('status')).toHaveTextContent('Grupa nie była jeszcze użyta.');
        await userEvent.clear(input);
        await userEvent.type(input, '   ');
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({alternativeGroup: null}));
    });
    it('blocks overlaps, allows only the same nonempty group, and permits adjacent hours', async () => {
        const submit = setupGroup();
        await userEvent.selectOptions(screen.getByLabelText('Służba od'), '15');
        expect(screen.getByRole('button', {name: 'Dodaj'})).toBeDisabled();
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(submit).not.toHaveBeenCalled();
        await userEvent.type(screen.getByLabelText('Grupa propozycji'), 'B');
        expect(screen.getByRole('button', {name: 'Dodaj'})).toBeDisabled();
        await userEvent.clear(screen.getByLabelText('Grupa propozycji'));
        await userEvent.type(screen.getByLabelText('Grupa propozycji'), 'A');
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(submit).toHaveBeenCalledOnce();
        await userEvent.clear(screen.getByLabelText('Grupa propozycji'));
        await userEvent.selectOptions(screen.getByLabelText('Służba od'), '18');
        expect(screen.getByRole('button', {name: 'Dodaj'})).toBeEnabled();
    });
    it('hides group selection without permission', () => {
        setupGroup(false);
        expect(screen.queryByLabelText('Grupa propozycji')).not.toBeInTheDocument();
    });
    it('blocks a range enclosing another proposal even if both groups are empty', async () => {
        render(<CreateProposalForm firstHour={7} lastHour={18} participantId={42} scheduleDayId={8}
            proposals={[{hourStart: 14, hourEnd: 17, alternativeGroup: null}]}
            onCancel={vi.fn()} onSubmit={vi.fn()} />);
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '19');
        expect(screen.getByRole('button', {name: 'Dodaj'})).toBeDisabled();
    });
});
it('removes a selected break when only the last two hours remain and resets its API fields', async () => {
    const onSubmit = renderForm();
    await userEvent.selectOptions(screen.getByLabelText('Służba do'), '18');
    await userEvent.selectOptions(screen.getByLabelText('Długość służby do'), '2');
    await userEvent.click(screen.getByRole('radio', {name: 'Z przerwą'}));
    await userEvent.selectOptions(screen.getByLabelText('Służba od'), '16');
    expect(screen.queryByRole('group', {name: 'Przerwa'})).not.toBeInTheDocument();
    expect(screen.queryByRole('group', {name: 'Długość przerwy'})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({hourStart: 16, hourEnd: 17, breakMode: 0}));
    const request = onSubmit.mock.calls[onSubmit.mock.calls.length - 1][0];
    expect(request).not.toHaveProperty('breakLengthStart');
    expect(request).not.toHaveProperty('breakLengthEnd');
    await userEvent.selectOptions(screen.getByLabelText('Służba od'), '15');
    expect(screen.getByRole('radio', {name: 'Bez przerwy'})).toBeChecked();
    await userEvent.click(screen.getByRole('radio', {name: 'Z przerwą'}));
    expect(Array.from((screen.getByLabelText('Długość przerwy do') as HTMLSelectElement).options).map(o => o.value)).toEqual(['1']);
});
