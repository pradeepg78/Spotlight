import { groupEventsByVenue, eventsWithLocation, venueKey } from './venueGrouping';
import { TicketmasterEvent } from '../types/events';

function makeEvent(
    id: string,
    venue?: { latitude: number; longitude: number; name: string }
): TicketmasterEvent {
    return {
        id,
        title: `Event ${id}`,
        date: '2026-09-01',
        time: '19:00:00',
        venueName: venue?.name ?? 'TBA',
        venue,
    };
}

const MICHIGAN_STADIUM = { latitude: 42.2658, longitude: -83.7487, name: 'Michigan Stadium' };
const CRISLER = { latitude: 42.2681, longitude: -83.7476, name: 'Crisler Center' };

describe('venueKey', () => {
    it('rounds to 4 decimal places', () => {
        expect(venueKey(42.26584321, -83.74871234)).toBe('42.2658,-83.7487');
    });

    it('gives coordinates within ~11m the same key', () => {
        expect(venueKey(42.26581, -83.74872)).toBe(venueKey(42.26583, -83.74874));
    });
});

describe('eventsWithLocation', () => {
    it('drops events with no venue coordinates', () => {
        const events = [
            makeEvent('a', MICHIGAN_STADIUM),
            makeEvent('b'), // online / TBA event
        ];
        expect(eventsWithLocation(events).map(e => e.id)).toEqual(['a']);
    });

    it('drops events whose coordinates are NaN', () => {
        const events = [makeEvent('a', { latitude: NaN, longitude: NaN, name: 'Broken' })];
        expect(eventsWithLocation(events)).toHaveLength(0);
    });
});

describe('groupEventsByVenue', () => {
    it('collapses many events at one venue into a single marker', () => {
        const events = [
            makeEvent('a', MICHIGAN_STADIUM),
            makeEvent('b', MICHIGAN_STADIUM),
            makeEvent('c', MICHIGAN_STADIUM),
        ];
        const groups = groupEventsByVenue(events);

        expect(groups).toHaveLength(1);
        expect(groups[0].venueName).toBe('Michigan Stadium');
        expect(groups[0].events).toHaveLength(3);
    });

    it('keeps distinct venues separate', () => {
        const groups = groupEventsByVenue([
            makeEvent('a', MICHIGAN_STADIUM),
            makeEvent('b', CRISLER),
        ]);
        expect(groups).toHaveLength(2);
    });

    it('merges events whose coordinates differ below the rounding threshold', () => {
        const groups = groupEventsByVenue([
            makeEvent('a', MICHIGAN_STADIUM),
            makeEvent('b', { ...MICHIGAN_STADIUM, latitude: 42.265812 }),
        ]);
        expect(groups).toHaveLength(1);
        expect(groups[0].events).toHaveLength(2);
    });

    it('sorts venues by event count, busiest first', () => {
        const groups = groupEventsByVenue([
            makeEvent('a', CRISLER),
            makeEvent('b', MICHIGAN_STADIUM),
            makeEvent('c', MICHIGAN_STADIUM),
        ]);
        expect(groups[0].venueName).toBe('Michigan Stadium');
        expect(groups[0].events).toHaveLength(2);
    });

    it('returns nothing for an empty list', () => {
        expect(groupEventsByVenue([])).toEqual([]);
    });

    it('ignores events that cannot be placed on the map', () => {
        expect(groupEventsByVenue([makeEvent('a'), makeEvent('b')])).toEqual([]);
    });
});
