import { assert } from "chai";
import NyaaKa, { Category, SortColumn, SortOrder } from "../src/index";

describe("NyaaKa", () => {
	describe("#search()", () => {
		it("should return a full set of torrents for an empty query", async () => {
			const searchResult = await NyaaKa.search("");

			assert.equal(searchResult.torrents.length, 75);
			assert.isFalse(searchResult.previous);
			assert.isTrue(searchResult.next);
		});

		it("should return torrents that match the provided query", async () => {
			const searchResult = await NyaaKa.search("summer");

			assert.isTrue(searchResult.torrents.length > 0);

			searchResult.torrents.forEach((torrent) => {
				assert.isTrue(torrent.title.toLowerCase().includes("summer"));
			});
		});

		it("should return torrents that match the provided category", async () => {
			let searchResult = await NyaaKa.search("", { category: Category.Audio });

			assert.isTrue(searchResult.torrents.length > 0);

			searchResult.torrents.forEach((torrent) => {
				assert.isTrue([Category.Audio, Category.AudioLossless, Category.AudioLossy].includes(torrent.category));
			});

			searchResult = await NyaaKa.search("", { category: Category.LiteratureEnglish });

			assert.isTrue(searchResult.torrents.length > 0);

			searchResult.torrents.forEach((torrent) => {
				assert.equal(torrent.category, Category.LiteratureEnglish);
			});
		});

		it("should return torrents sorted by date", async () => {
			const searchResult = await NyaaKa.search("", { sort: { column: SortColumn.Date, order: SortOrder.Descending } });

			assert.isTrue(searchResult.torrents.length > 0);

			for (let i = 1; i < searchResult.torrents.length; i++) {
				const a = searchResult.torrents[i - 1];
				const b = searchResult.torrents[i];

				assert.isTrue(a.date.getTime() >= b.date.getTime());
			}
		});
	});
});
