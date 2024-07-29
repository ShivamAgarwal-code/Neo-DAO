using System;
using System.ComponentModel;
using System.Numerics;
using Neo;
using Neo.SmartContract.Framework;
// using Neo.SmartContract.Framework.Attributes;
using Neo.SmartContract.Framework.Native;
using Neo.SmartContract.Framework.Services;

/**
    NOTE: This file contains an object for storing the container and object ID pair
        that identifies uniquely an asset (e.g. - file) on NeoFS.
*/

#nullable enable

namespace AndroidTechnologies
{
    // --------------------- CONSTANTS --------------------


    public class AssetLocationNeoFS
    {

        /// <summary>
        /// The container ID for a NeoFS asset.
        /// </summary>
        public ByteString ContainerId = default!;

        /// <summary>
        /// The object ID for a NeoFS asset.
        /// </summary>
        public ByteString ObjectId = default!;

        /// <summary>
        /// Constructor.
        /// </summary>
        /// <param name="containerId">The container ID where the asset resides.</param>
        /// <param name="objectId">The asset's object ID.</param>
        public AssetLocationNeoFS(ByteString containerId, ByteString objectId) {
            if (MyUtilities.IsEmptyString(containerId))
                throw new Exception($"({nameof(AssetLocationNeoFS)}) The container ID is empty.");
            if (MyUtilities.IsEmptyString(objectId))
                throw new Exception($"({nameof(AssetLocationNeoFS)}) The object ID is empty.");

            this.ContainerId = containerId;
            this.ObjectId = objectId;
        }

        /// <summary>
        /// Returns a string that concatenates the container and object
        ///  IDs into a colon delimited string.
        /// </summary>
        /// <returns>Returns a string that concatenates the container and object
        ///  IDs into a colon delimited string.</returns>
        public string ToIdPair()
        {
            return this.ContainerId + ":" + this.ObjectId;
        }
    }
}